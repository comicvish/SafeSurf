import { db } from '../src/services/firestore.js'
import type { LessonDoc, PracticeSessionDoc } from '../src/types.js'

// One-off: the admin "assign video" flow creates a brand-new lesson doc
// instead of attaching a video to an existing one, so assigning a real video
// to a lesson that already existed (with a stored fallback title) left two
// lesson docs for the same slot. This merges each duplicate back onto the
// original slug-ID lesson (videoId + summary) and moves its generated
// practice quiz over, then deletes the duplicate.
const MERGES: { keepLessonId: string; dropLessonId: string }[] = [
  { keepLessonId: 'recognizing-urgent-language', dropLessonId: 'vcJSvjttLIGZHh3sJM7e' },
  { keepLessonId: 'verifying-a-caller', dropLessonId: '4nHMeaI40gFhgnGbCN30' },
  { keepLessonId: 'fake-shopping-sites', dropLessonId: 'dfHoYYgvN4RFpwopE20g' },
]

async function main() {
  for (const { keepLessonId, dropLessonId } of MERGES) {
    const keepRef = db.collection('lessons').doc(keepLessonId)
    const dropRef = db.collection('lessons').doc(dropLessonId)

    const [keepSnap, dropSnap] = await Promise.all([keepRef.get(), dropRef.get()])
    if (!keepSnap.exists || !dropSnap.exists) {
      console.log(`Skipping ${keepLessonId}/${dropLessonId} — one side missing`)
      continue
    }
    const dropLesson = dropSnap.data() as LessonDoc

    await keepRef.update({ videoId: dropLesson.videoId, summary: dropLesson.summary })
    console.log(`Merged videoId ${dropLesson.videoId} onto ${keepLessonId}`)

    const dropQuizRef = db.collection('practiceSessions').doc(dropLessonId)
    const dropQuizSnap = await dropQuizRef.get()
    if (dropQuizSnap.exists) {
      const quiz = dropQuizSnap.data() as PracticeSessionDoc
      await db
        .collection('practiceSessions')
        .doc(keepLessonId)
        .set({ ...quiz, lessonId: keepLessonId } satisfies PracticeSessionDoc)
      await dropQuizRef.delete()
      console.log(`Moved practice quiz from ${dropLessonId} to ${keepLessonId}`)
    }

    await dropRef.delete()
    console.log(`Deleted duplicate lesson ${dropLessonId}`)
  }
  console.log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
