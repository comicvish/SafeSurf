import { db } from '../src/services/firestore.js'
import type { VideoDoc } from '../src/types.js'

// One-off: delete the Big Buck Bunny placeholder video docs seeded before
// real recordings existed (see the old seed.ts, which used to attach this
// YouTube ID to every seeded lesson).
const PLACEHOLDER_YOUTUBE_ID = 'aqz-KE-bpKQ'

async function main() {
  const snap = await db.collection('videos').where('youtubeVideoId', '==', PLACEHOLDER_YOUTUBE_ID).get()

  if (snap.empty) {
    console.log('No placeholder videos found.')
    return
  }

  for (const doc of snap.docs) {
    const video = doc.data() as VideoDoc
    console.log(`Deleting ${doc.id} (${video.title}, status: ${video.status})`)
    await doc.ref.delete()
  }

  console.log(`Done. ${snap.size} placeholder video(s) deleted.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
