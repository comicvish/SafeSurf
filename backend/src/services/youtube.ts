import { FieldPath } from '@google-cloud/firestore'
import { db } from './firestore.js'
import { chunk, FIRESTORE_IN_QUERY_LIMIT } from './firestoreUtils.js'
import type { SyncResult, VideoDoc } from '../types.js'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
// YouTube's videos.list endpoint accepts at most 50 IDs per request.
const MAX_VIDEO_IDS_PER_REQUEST = 50

interface YoutubeThumbnails {
  medium?: { url: string }
  default?: { url: string }
}

interface YoutubeErrorBody {
  error?: { message?: string }
}

async function youtubeFetch<T>(url: string): Promise<T & YoutubeErrorBody> {
  const res = await fetch(url)
  const data = (await res.json()) as T & YoutubeErrorBody
  if (!res.ok || data.error) {
    const message = data.error?.message ?? res.statusText
    throw new Error(`YouTube API request failed (${res.status}): ${message}`)
  }
  return data
}

async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  const data = await youtubeFetch<{ items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }>(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
  )
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null
}

async function getUploadedVideoIds(apiKey: string, playlistId: string): Promise<string[]> {
  const videoIds: string[] = []
  let pageToken: string | undefined

  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : ''
    const data = await youtubeFetch<{
      items?: { contentDetails: { videoId: string } }[]
      nextPageToken?: string
    }>(`${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50${pageParam}&key=${apiKey}`)
    videoIds.push(...(data.items ?? []).map((item) => item.contentDetails.videoId))
    pageToken = data.nextPageToken
  } while (pageToken)

  return videoIds
}

interface YoutubeVideoDetails {
  id: string
  snippet: { title: string; description: string; thumbnails: YoutubeThumbnails }
  status: { embeddable: boolean; privacyStatus: string }
}

async function getVideoDetails(apiKey: string, videoIds: string[]): Promise<YoutubeVideoDetails[]> {
  if (videoIds.length === 0) return []

  const batches: string[][] = []
  for (let i = 0; i < videoIds.length; i += MAX_VIDEO_IDS_PER_REQUEST) {
    batches.push(videoIds.slice(i, i + MAX_VIDEO_IDS_PER_REQUEST))
  }

  const results = await Promise.all(
    batches.map((batch) =>
      youtubeFetch<{ items?: YoutubeVideoDetails[] }>(
        `${YOUTUBE_API_BASE}/videos?part=snippet,status&id=${batch.join(',')}&key=${apiKey}`,
      ),
    ),
  )
  return results.flatMap((data) => data.items ?? [])
}

export async function syncYoutubeVideos(): Promise<SyncResult> {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID
  if (!apiKey || !channelId) {
    throw new Error('YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must be configured')
  }

  const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId)
  if (!uploadsPlaylistId) {
    return { channelVideosFound: 0, newVideos: 0, updatedVideos: 0, failedVideos: 0 }
  }

  const videoIds = await getUploadedVideoIds(apiKey, uploadsPlaylistId)
  const videos = await getVideoDetails(apiKey, videoIds)
  if (videos.length === 0) {
    return { channelVideosFound: videoIds.length, newVideos: 0, updatedVideos: 0, failedVideos: 0 }
  }

  // One batched existence check (chunked `in` queries, doc-ID projection
  // only) instead of an `await ref.get()` per video, then one BulkWriter
  // instead of an `await ref.set()` per video — replaces what was up to
  // 2 sequential Firestore round-trips per synced video with a handful of
  // batched ones.
  const existingIds = new Set<string>()
  const existingSnaps = await Promise.all(
    chunk(
      videos.map((v) => v.id),
      FIRESTORE_IN_QUERY_LIMIT,
    ).map((batch) => db.collection('videos').select().where(FieldPath.documentId(), 'in', batch).get()),
  )
  existingSnaps.forEach((snap) => snap.forEach((doc) => existingIds.add(doc.id)))

  let newVideos = 0
  let updatedVideos = 0
  let failedVideos = 0
  const writer = db.bulkWriter()
  // BulkWriter retries transient failures internally, but a write can still
  // fail permanently — attach a handler to every write promise (so counts
  // only reflect writes that actually succeeded, and no rejection goes
  // unhandled) instead of assuming success once the batch is enqueued.
  const pending: Promise<void>[] = []

  for (const video of videos) {
    const ref = db.collection('videos').doc(video.id)
    const thumbnailUrl = video.snippet.thumbnails.medium?.url ?? video.snippet.thumbnails.default?.url ?? ''

    const metadata = {
      youtubeVideoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl,
      embeddable: video.status.embeddable,
      privacyStatus: video.status.privacyStatus,
    }

    // Never touch `status` on re-sync — it may already be 'assigned' by an admin.
    // update()/create() (rather than set()) are existence-preconditioned, so
    // a race between the existence check above and this write (the video
    // gets deleted, or a second sync run creates it first) fails the write
    // instead of silently resurrecting a deleted doc or clobbering one that
    // was created concurrently — a failure here is caught below and counted.
    const isUpdate = existingIds.has(video.id)
    const writePromise = isUpdate
      ? writer.update(ref, metadata)
      : writer.create(ref, { ...metadata, status: 'unassigned' } satisfies VideoDoc)

    pending.push(
      writePromise.then(
        () => {
          if (isUpdate) updatedVideos++
          else newVideos++
        },
        (err: unknown) => {
          failedVideos++
          console.error(`Failed to sync video ${video.id} to Firestore`, err)
        },
      ),
    )
  }

  await writer.close()
  await Promise.all(pending)

  if (failedVideos > 0) {
    console.error(`YouTube sync: ${failedVideos} of ${videos.length} video(s) failed to write to Firestore`)
  }

  return { channelVideosFound: videoIds.length, newVideos, updatedVideos, failedVideos }
}
