import { db } from './firestore.js'
import type { UnassignedVideo, VideoDoc } from '../types.js'

export async function listUnassignedVideos(): Promise<UnassignedVideo[]> {
  const snap = await db.collection('videos').where('status', '==', 'unassigned').get()
  return snap.docs.map((doc) => {
    const data = doc.data() as VideoDoc
    return {
      id: doc.id,
      youtubeVideoId: data.youtubeVideoId,
      title: data.title,
      thumbnailUrl: data.thumbnailUrl,
      embeddable: data.embeddable,
      privacyStatus: data.privacyStatus,
    }
  })
}

export async function markVideoAssigned(videoId: string): Promise<void> {
  await db.collection('videos').doc(videoId).update({ status: 'assigned' })
}
