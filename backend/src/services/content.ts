import { FieldPath } from '@google-cloud/firestore'
import { db } from './firestore.js'
import { chunk, FIRESTORE_IN_QUERY_LIMIT } from './firestoreUtils.js'
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
}): Promise<{
  lessonId: string
  video: { title: string; description: string; thumbnailUrl: string; youtubeVideoId: string }
  courseTitle: string
  unitTitle: string
}> {
  const unitRef = db.collection('units').doc(input.unitId)
  const videoRef = db.collection('videos').doc(input.videoId)
  const lessonRef = db.collection('lessons').doc()

  // Reading the video/unit, creating the lesson, and claiming the video all
  // happen in one transaction so a lesson can never be created against a
  // video that's already assigned (or left half-claimed by a crash).
  const { video, unit } = await db.runTransaction(async (tx) => {
    const [unitSnap, videoSnap] = await Promise.all([tx.get(unitRef), tx.get(videoRef)])
    if (!unitSnap.exists) throw new Error('Unit not found')
    if (!videoSnap.exists) throw new Error('Video not found')
    const videoData = videoSnap.data() as VideoDoc
    if (videoData.status === 'assigned') throw new Error('Video is already assigned to a lesson')

    tx.set(lessonRef, {
      unitId: input.unitId,
      videoId: input.videoId,
      order: input.order,
      summary: input.summary,
    } satisfies LessonDoc)
    tx.update(videoRef, { status: 'assigned' })
    return { video: videoData, unit: unitSnap.data() as UnitDoc }
  })

  const courseSnap = await db.collection('courses').doc(unit.courseId).get()
  const courseTitle = courseSnap.exists ? (courseSnap.data() as CourseDoc).title : ''

  return {
    lessonId: lessonRef.id,
    video: {
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      youtubeVideoId: video.youtubeVideoId,
    },
    courseTitle,
    unitTitle: unit.title,
  }
}

// Lists courses with unit/lesson *counts* only — used by the public course
// catalog, which never needs unit titles or lesson bodies. Counts come from
// Firestore's count() aggregation (billed per up-to-1000 index entries
// scanned, minimum one read, regardless of matched document count) instead
// of downloading every unit/lesson document just to call `.length` on it.
export async function listCourses(): Promise<CourseSummary[]> {
  // Field projection: only the 3 fields the summary response actually uses.
  const coursesSnap = await db.collection('courses').orderBy('order').select('title', 'description', 'order').get()

  return Promise.all(
    coursesSnap.docs.map(async (doc) => {
      const data = doc.data() as Pick<CourseDoc, 'title' | 'description' | 'order'>

      // Still need the unit IDs themselves (not just a count) to chunk the
      // lesson-count query below by unitId, so this one stays a document
      // read — but `.select()` with no fields fetches IDs only, no field data.
      const unitsSnap = await db.collection('units').where('courseId', '==', doc.id).select().get()
      const unitIds = unitsSnap.docs.map((u) => u.id)

      let lessonCount = 0
      if (unitIds.length > 0) {
        const countSnaps = await Promise.all(
          chunk(unitIds, FIRESTORE_IN_QUERY_LIMIT).map((batch) =>
            db.collection('lessons').where('unitId', 'in', batch).count().get(),
          ),
        )
        lessonCount = countSnaps.reduce((sum, snap) => sum + snap.data().count, 0)
      }

      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        order: data.order,
        unitCount: unitIds.length,
        lessonCount,
      }
    }),
  )
}

// Full nested detail (units + lessons + lesson titles) for *every* course in
// one batched call. Exists so the frontend can render a multi-course view
// (the dashboard) with a single request instead of calling getCourseDetail
// once per course — see routes/courses.ts's /courses/details.
export async function listCourseDetails(): Promise<CourseDetail[]> {
  const [coursesSnap, unitsSnap, lessonsSnap] = await Promise.all([
    db.collection('courses').orderBy('order').get(),
    db.collection('units').orderBy('order').get(),
    db.collection('lessons').get(),
  ])

  const titleByVideoId = await getVideoTitles(lessonsSnap.docs.map((doc) => (doc.data() as LessonDoc).videoId))

  const lessonsByUnit = new Map<string, UnitWithLessons['lessons']>()
  lessonsSnap.forEach((doc) => {
    const data = doc.data() as LessonDoc
    const list = lessonsByUnit.get(data.unitId) ?? []
    list.push({
      id: doc.id,
      title: titleByVideoId.get(data.videoId) ?? '',
      order: data.order,
      summary: data.summary,
    })
    lessonsByUnit.set(data.unitId, list)
  })
  lessonsByUnit.forEach((lessons) => lessons.sort((a, b) => a.order - b.order))

  const unitsByCourse = new Map<string, UnitWithLessons[]>()
  unitsSnap.forEach((doc) => {
    const data = doc.data() as UnitDoc
    const list = unitsByCourse.get(data.courseId) ?? []
    list.push({ id: doc.id, title: data.title, order: data.order, lessons: lessonsByUnit.get(doc.id) ?? [] })
    unitsByCourse.set(data.courseId, list)
  })

  return coursesSnap.docs.map((doc) => {
    const data = doc.data() as CourseDoc
    return { id: doc.id, title: data.title, description: data.description, units: unitsByCourse.get(doc.id) ?? [] }
  })
}

// Shared by listCourseDetails/getCourseDetail — resolves video titles for a
// batch of video IDs using only the `title` field (Firestore `.select()`
// projection), never the full video document.
async function getVideoTitles(videoIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(videoIds)]
  const titleByVideoId = new Map<string, string>()
  if (uniqueIds.length === 0) return titleByVideoId

  const videosSnaps = await Promise.all(
    chunk(uniqueIds, FIRESTORE_IN_QUERY_LIMIT).map((batch) =>
      db.collection('videos').select('title').where(FieldPath.documentId(), 'in', batch).get(),
    ),
  )
  videosSnaps.forEach((snap) =>
    snap.forEach((doc) => titleByVideoId.set(doc.id, (doc.data() as Pick<VideoDoc, 'title'>).title)),
  )
  return titleByVideoId
}

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
  const courseSnap = await db.collection('courses').doc(courseId).get()
  if (!courseSnap.exists) return null
  const course = courseSnap.data() as CourseDoc

  const unitsSnap = await db.collection('units').where('courseId', '==', courseId).orderBy('order').get()
  const unitIds = unitsSnap.docs.map((doc) => doc.id)

  const lessonsByUnit = new Map<string, { id: string; videoId: string; order: number; summary: string }[]>()
  if (unitIds.length > 0) {
    const lessonsSnaps = await Promise.all(
      chunk(unitIds, FIRESTORE_IN_QUERY_LIMIT).map((batch) => db.collection('lessons').where('unitId', 'in', batch).get()),
    )
    lessonsSnaps.forEach((snap) =>
      snap.forEach((doc) => {
        const data = doc.data() as LessonDoc
        const list = lessonsByUnit.get(data.unitId) ?? []
        list.push({ id: doc.id, videoId: data.videoId, order: data.order, summary: data.summary })
        lessonsByUnit.set(data.unitId, list)
      }),
    )
  }

  // Lesson titles are never stored on the lesson — they always mirror the
  // linked video's current title, so a rename on YouTube shows up here too.
  const titleByVideoId = await getVideoTitles([...lessonsByUnit.values()].flat().map((lesson) => lesson.videoId))

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

// Just the lesson IDs of a course, in curriculum order — used to compute a
// lesson's prev/next neighbor. Deliberately leaner than getCourseDetail:
// projects only `order`/`unitId` off each document instead of pulling
// summaries and resolving video titles for the whole course on every single
// lesson-detail request (this endpoint is the hottest read path in the app).
async function getOrderedLessonIds(courseId: string): Promise<string[]> {
  const unitsSnap = await db.collection('units').where('courseId', '==', courseId).orderBy('order').select().get()
  const unitIds = unitsSnap.docs.map((doc) => doc.id)
  if (unitIds.length === 0) return []

  const lessonsSnaps = await Promise.all(
    chunk(unitIds, FIRESTORE_IN_QUERY_LIMIT).map((batch) =>
      db.collection('lessons').where('unitId', 'in', batch).select('unitId', 'order').get(),
    ),
  )
  const lessonsByUnit = new Map<string, { id: string; order: number }[]>()
  lessonsSnaps.forEach((snap) =>
    snap.forEach((doc) => {
      const data = doc.data() as Pick<LessonDoc, 'unitId' | 'order'>
      const list = lessonsByUnit.get(data.unitId) ?? []
      list.push({ id: doc.id, order: data.order })
      lessonsByUnit.set(data.unitId, list)
    }),
  )
  lessonsByUnit.forEach((lessons) => lessons.sort((a, b) => a.order - b.order))

  return unitIds.flatMap((unitId) => (lessonsByUnit.get(unitId) ?? []).map((lesson) => lesson.id))
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

  const orderedLessonIds = await getOrderedLessonIds(unit.courseId)
  const idx = orderedLessonIds.indexOf(lessonId)
  const prevLessonId = idx > 0 ? orderedLessonIds[idx - 1] : null
  const nextLessonId = idx >= 0 && idx < orderedLessonIds.length - 1 ? orderedLessonIds[idx + 1] : null

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
