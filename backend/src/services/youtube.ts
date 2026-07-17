import { db } from './firestore.js'
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
    return { channelVideosFound: 0, newVideos: 0, updatedVideos: 0 }
  }

  const videoIds = await getUploadedVideoIds(apiKey, uploadsPlaylistId)
  const videos = await getVideoDetails(apiKey, videoIds)

  let newVideos = 0
  let updatedVideos = 0

  for (const video of videos) {
    const ref = db.collection('videos').doc(video.id)
    const existing = await ref.get()
    const thumbnailUrl = video.snippet.thumbnails.medium?.url ?? video.snippet.thumbnails.default?.url ?? ''

    const metadata = {
      youtubeVideoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl,
      embeddable: video.status.embeddable,
      privacyStatus: video.status.privacyStatus,
    }

    if (existing.exists) {
      // Never touch `status` on re-sync — it may already be 'assigned' by an admin.
      await ref.set(metadata, { merge: true })
      updatedVideos++
    } else {
      await ref.set({ ...metadata, status: 'unassigned' } satisfies VideoDoc)
      newVideos++
    }
  }

  return { channelVideosFound: videoIds.length, newVideos, updatedVideos }
}
