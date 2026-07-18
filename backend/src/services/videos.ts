import { db } from './firestore.js'
import type { UnassignedVideo, UnassignedVideoPage, VideoDoc } from '../types.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export async function listUnassignedVideos(options: { limit?: number; cursor?: string } = {}): Promise<UnassignedVideoPage> {
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)

  // No explicit orderBy — Firestore's implicit default order (by document
  // ID) is what startAfter(snapshot) paginates against below, which avoids
  // needing a composite index for status + an explicit sort field.
  let query = db.collection('videos').where('status', '==', 'unassigned').limit(limit)

  if (options.cursor) {
    const cursorSnap = await db.collection('videos').doc(options.cursor).get()
    if (cursorSnap.exists) query = query.startAfter(cursorSnap)
  }

  const snap = await query.get()
  const videos: UnassignedVideo[] = snap.docs.map((doc) => {
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

  // A full page implies there may be more — an empty/partial page means
  // we've reached the end.
  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null

  return { videos, nextCursor }
}
