import { db } from './firestore.js'
import type { SyncResult, VideoDoc } from '../types.js'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YoutubeThumbnails {
  medium?: { url: string }
  default?: { url: string }
}

async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  const res = await fetch(`${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`)
  const data = await res.json()
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null
}

async function getUploadedVideoIds(apiKey: string, playlistId: string): Promise<string[]> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}`,
  )
  const data = await res.json()
  if (data.error) return []
  return (data.items ?? []).map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId)
}

interface YoutubeVideoDetails {
  id: string
  snippet: { title: string; description: string; thumbnails: YoutubeThumbnails }
  status: { embeddable: boolean; privacyStatus: string }
}

async function getVideoDetails(apiKey: string, videoIds: string[]): Promise<YoutubeVideoDetails[]> {
  if (videoIds.length === 0) return []
  const res = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,status&id=${videoIds.join(',')}&key=${apiKey}`)
  const data = await res.json()
  return data.items ?? []
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
