import { db } from '../src/services/firestore.js'
import type { CourseDoc, LessonDoc, UnitDoc, VideoDoc } from '../src/types.js'

// Placeholder video (Blender Foundation's Big Buck Bunny trailer — public,
// always embeddable) until real SafeSurf lessons are synced in Phase 4.
const PLACEHOLDER_VIDEO: VideoDoc = {
  youtubeVideoId: 'aqz-KE-bpKQ',
  title: 'Placeholder lesson video',
  description: 'Sample video standing in for a real SafeSurf lesson recording.',
  thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
}

async function seedVideo(id: string): Promise<void> {
  await db.collection('videos').doc(id).set(PLACEHOLDER_VIDEO)
}

async function seedCourse(
  id: string,
  course: CourseDoc,
  units: { id: string; unit: UnitDoc; lessons: { id: string; lesson: Omit<LessonDoc, 'unitId' | 'videoId'> }[] }[],
): Promise<void> {
  await db.collection('courses').doc(id).set(course)
  for (const { id: unitId, unit, lessons } of units) {
    await db.collection('units').doc(unitId).set(unit)
    for (const { id: lessonId, lesson } of lessons) {
      await seedVideo(`${lessonId}-video`)
      await db
        .collection('lessons')
        .doc(lessonId)
        .set({ ...lesson, unitId, videoId: `${lessonId}-video` } satisfies LessonDoc)
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
            lesson: { title: 'Recognizing urgent language', order: 1, summary: 'Why scammers rush you, and how to slow down.' },
          },
          {
            id: 'verifying-a-caller',
            lesson: { title: 'Verifying a caller', order: 2, summary: 'Simple steps to confirm who you are really talking to.' },
          },
        ],
      },
      {
        id: 'online-scams',
        unit: { courseId: 'spotting-scams', title: 'Online Scams', order: 2 },
        lessons: [
          {
            id: 'fake-shopping-sites',
            lesson: { title: 'Fake shopping sites', order: 1, summary: 'Red flags that a store online is not what it seems.' },
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
            lesson: { title: 'Building a strong password', order: 1, summary: 'What actually makes a password hard to crack.' },
          },
          {
            id: 'using-a-password-manager',
            lesson: { title: 'Using a password manager', order: 2, summary: 'Why remembering every password yourself is the wrong goal.' },
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
