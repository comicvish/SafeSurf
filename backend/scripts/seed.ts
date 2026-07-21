import { db } from '../src/services/firestore.js'
import type { CourseDoc, LessonDoc, UnitDoc } from '../src/types.js'

// Lessons are seeded without a video — real recordings get attached later
// via the admin "assign video" flow (see routes/admin.ts), which is also
// what fills in videoId and lets the lesson's title start mirroring the
// video's title instead of this fallback.
async function seedCourse(
  id: string,
  course: CourseDoc,
  units: {
    id: string
    unit: UnitDoc
    lessons: { id: string; title: string; lesson: Omit<LessonDoc, 'unitId' | 'videoId' | 'title'> }[]
  }[],
): Promise<void> {
  await db.collection('courses').doc(id).set(course)
  for (const { id: unitId, unit, lessons } of units) {
    await db.collection('units').doc(unitId).set(unit)
    for (const { id: lessonId, title, lesson } of lessons) {
      await db
        .collection('lessons')
        .doc(lessonId)
        .set({ ...lesson, unitId, title } satisfies LessonDoc)
    }
  }
}

async function main() {
  await seedCourse(
    'spotting-scams',
    { title: 'Spotting Scams', description: 'Learn to recognize and avoid common online and phone scams.', order: 1 },
    [
      {
        id: 'phone-text-scams',
        unit: { courseId: 'spotting-scams', title: 'Phone & Text Scams', order: 1 },
        lessons: [
          {
            id: 'recognizing-urgent-language',
            title: 'Recognizing urgent language',
            lesson: { order: 1, summary: 'Why scammers rush you, and how to slow down.' },
          },
          {
            id: 'verifying-a-caller',
            title: 'Verifying a caller',
            lesson: { order: 2, summary: 'Simple steps to confirm who you are really talking to.' },
          },
        ],
      },
      {
        id: 'online-scams',
        unit: { courseId: 'spotting-scams', title: 'Online Scams', order: 2 },
        lessons: [
          {
            id: 'fake-shopping-sites',
            title: 'Fake shopping sites',
            lesson: { order: 1, summary: 'Red flags that a store online is not what it seems.' },
          },
        ],
      },
    ],
  )

  await seedCourse(
    'password-account-safety',
    { title: 'Password & Account Safety', description: 'Build habits that keep your accounts secure.', order: 2 },
    [
      {
        id: 'strong-passwords',
        unit: { courseId: 'password-account-safety', title: 'Strong Passwords', order: 1 },
        lessons: [
          {
            id: 'building-a-strong-password',
            title: 'Building a strong password',
            lesson: { order: 1, summary: 'What actually makes a password hard to crack.' },
          },
          {
            id: 'using-a-password-manager',
            title: 'Using a password manager',
            lesson: { order: 2, summary: 'Why remembering every password yourself is the wrong goal.' },
          },
        ],
      },
    ],
  )

  console.log('Seed complete.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
