import { FieldPath } from '@google-cloud/firestore'
import { db } from './firestore.js'
import type {
  CourseDetail,
  CourseDoc,
  CourseSummary,
  LessonDetail,
  LessonDoc,
  UnitDoc,
  UnitWithLessons,
  VideoDoc,
} from '../types.js'

export async function createLesson(input: {
  unitId: string
  videoId: string
  order: number
  summary: string
}): Promise<{ lessonId: string; video: { title: string; description: string } }> {
  const [unitSnap, videoSnap] = await Promise.all([
    db.collection('units').doc(input.unitId).get(),
    db.collection('videos').doc(input.videoId).get(),
  ])
  if (!unitSnap.exists) throw new Error('Unit not found')
  if (!videoSnap.exists) throw new Error('Video not found')
  const video = videoSnap.data() as VideoDoc

  const ref = await db.collection('lessons').add({
    unitId: input.unitId,
    videoId: input.videoId,
    order: input.order,
    summary: input.summary,
  } satisfies LessonDoc)
  return { lessonId: ref.id, video: { title: video.title, description: video.description } }
}

export async function listCourses(): Promise<CourseSummary[]> {
  const [coursesSnap, unitsSnap, lessonsSnap] = await Promise.all([
    db.collection('courses').orderBy('order').get(),
    db.collection('units').get(),
    db.collection('lessons').get(),
  ])

  const unitIdsByCourse = new Map<string, string[]>()
  unitsSnap.forEach((doc) => {
    const data = doc.data() as UnitDoc
    const list = unitIdsByCourse.get(data.courseId) ?? []
    list.push(doc.id)
    unitIdsByCourse.set(data.courseId, list)
  })

  const lessonCountByUnit = new Map<string, number>()
  lessonsSnap.forEach((doc) => {
    const data = doc.data() as LessonDoc
    lessonCountByUnit.set(data.unitId, (lessonCountByUnit.get(data.unitId) ?? 0) + 1)
  })

  return coursesSnap.docs.map((doc) => {
    const data = doc.data() as CourseDoc
    const unitIds = unitIdsByCourse.get(doc.id) ?? []
    const lessonCount = unitIds.reduce((sum, unitId) => sum + (lessonCountByUnit.get(unitId) ?? 0), 0)
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      order: data.order,
      unitCount: unitIds.length,
      lessonCount,
    }
  })
}

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
  const courseSnap = await db.collection('courses').doc(courseId).get()
  if (!courseSnap.exists) return null
  const course = courseSnap.data() as CourseDoc

  const unitsSnap = await db.collection('units').where('courseId', '==', courseId).orderBy('order').get()
  const unitIds = unitsSnap.docs.map((doc) => doc.id)

  const lessonsByUnit = new Map<string, { id: string; videoId: string; order: number; summary: string }[]>()
  if (unitIds.length > 0) {
    const lessonsSnap = await db.collection('lessons').where('unitId', 'in', unitIds).get()
    lessonsSnap.forEach((doc) => {
      const data = doc.data() as LessonDoc
      const list = lessonsByUnit.get(data.unitId) ?? []
      list.push({ id: doc.id, videoId: data.videoId, order: data.order, summary: data.summary })
      lessonsByUnit.set(data.unitId, list)
    })
  }

  // Lesson titles are never stored on the lesson — they always mirror the
  // linked video's current title, so a rename on YouTube shows up here too.
  const videoIds = [...new Set([...lessonsByUnit.values()].flat().map((lesson) => lesson.videoId))]
  const titleByVideoId = new Map<string, string>()
  if (videoIds.length > 0) {
    const videosSnap = await db.collection('videos').where(FieldPath.documentId(), 'in', videoIds).get()
    videosSnap.forEach((doc) => titleByVideoId.set(doc.id, (doc.data() as VideoDoc).title))
  }

  const units: UnitWithLessons[] = unitsSnap.docs.map((doc) => {
    const data = doc.data() as UnitDoc
    const lessons = (lessonsByUnit.get(doc.id) ?? [])
      .map((lesson) => ({
        id: lesson.id,
        title: titleByVideoId.get(lesson.videoId) ?? '',
        order: lesson.order,
        summary: lesson.summary,
      }))
      .sort((a, b) => a.order - b.order)
    return { id: doc.id, title: data.title, order: data.order, lessons }
  })

  return { id: courseId, title: course.title, description: course.description, units }
}

export async function getLessonDetail(lessonId: string): Promise<LessonDetail | null> {
  const lessonSnap = await db.collection('lessons').doc(lessonId).get()
  if (!lessonSnap.exists) return null
  const lesson = lessonSnap.data() as LessonDoc

  const [unitSnap, videoSnap] = await Promise.all([
    db.collection('units').doc(lesson.unitId).get(),
    db.collection('videos').doc(lesson.videoId).get(),
  ])
  if (!unitSnap.exists || !videoSnap.exists) return null
  const unit = unitSnap.data() as UnitDoc
  const video = videoSnap.data() as VideoDoc

  const courseSnap = await db.collection('courses').doc(unit.courseId).get()
  if (!courseSnap.exists) return null
  const course = courseSnap.data() as CourseDoc

  const courseDetail = await getCourseDetail(unit.courseId)
  const flatLessonIds = (courseDetail?.units ?? []).flatMap((u) => u.lessons.map((l) => l.id))
  const idx = flatLessonIds.indexOf(lessonId)
  const prevLessonId = idx > 0 ? flatLessonIds[idx - 1] : null
  const nextLessonId = idx >= 0 && idx < flatLessonIds.length - 1 ? flatLessonIds[idx + 1] : null

  return {
    id: lessonId,
    title: video.title,
    summary: lesson.summary,
    video: { youtubeVideoId: video.youtubeVideoId, title: video.title, description: video.description },
    unit: { id: lesson.unitId, title: unit.title },
    course: { id: unit.courseId, title: course.title },
    prevLessonId,
    nextLessonId,
  }
}
