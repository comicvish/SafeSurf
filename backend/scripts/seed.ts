import { db } from '../src/services/firestore.js'
import type { CourseDoc, LessonDoc, UnitDoc, VideoDoc } from '../src/types.js'

// Placeholder video (Blender Foundation's Big Buck Bunny trailer — public,
// always embeddable) until real VeraBlock lessons are synced in Phase 4.
// Lesson titles always mirror the linked video's title, so each seeded
// video gets its own distinct title matching the intended lesson name.
const PLACEHOLDER_VIDEO: Omit<VideoDoc, 'title'> = {
  youtubeVideoId: 'aqz-KE-bpKQ',
  description: 'Sample video standing in for a real VeraBlock lesson recording.',
  thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
  embeddable: true,
  privacyStatus: 'public',
  status: 'assigned',
}

async function seedVideo(id: string, title: string): Promise<void> {
  await db
    .collection('videos')
    .doc(id)
    .set({ ...PLACEHOLDER_VIDEO, title } satisfies VideoDoc)
}

async function seedCourse(
  id: string,
  course: CourseDoc,
  units: {
    id: string
    unit: UnitDoc
    lessons: { id: string; title: string; lesson: Omit<LessonDoc, 'unitId' | 'videoId'> }[]
  }[],
): Promise<void> {
  await db.collection('courses').doc(id).set(course)
  for (const { id: unitId, unit, lessons } of units) {
    await db.collection('units').doc(unitId).set(unit)
    for (const { id: lessonId, title, lesson } of lessons) {
      await seedVideo(`${lessonId}-video`, title)
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
