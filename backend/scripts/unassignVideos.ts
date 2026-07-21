import { FieldValue } from '@google-cloud/firestore'
import { db } from '../src/services/firestore.js'
import type { LessonDoc, VideoDoc } from '../src/types.js'

// One-off: detach every lesson from its current video (keeping the video
// docs themselves) and flip those videos back to 'unassigned' so they show
// up again in the admin "assign video" list. Stores the video's current
// title on the lesson first so lesson titles don't go blank.
async function main() {
  const lessonsSnap = await db.collection('lessons').get()

  let unassigned = 0
  for (const doc of lessonsSnap.docs) {
    const lesson = doc.data() as LessonDoc
    if (!lesson.videoId) continue

    const videoRef = db.collection('videos').doc(lesson.videoId)
    const videoSnap = await videoRef.get()
    const video = videoSnap.exists ? (videoSnap.data() as VideoDoc) : undefined

    await doc.ref.update({
      videoId: FieldValue.delete(),
      title: lesson.title ?? video?.title ?? '',
    })
    if (videoSnap.exists) {
      await videoRef.update({ status: 'unassigned' })
    }

    console.log(`Unassigned ${doc.id} (was ${lesson.videoId})`)
    unassigned++
  }

  console.log(`Done. ${unassigned} lesson(s) unassigned.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
