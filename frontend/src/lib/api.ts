import type { CourseDetail, CourseSummary, LessonDetail } from './types'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with ${res.status}`)
  }
  return res.json()
}

export function listCourses(): Promise<{ courses: CourseSummary[] }> {
  return getJson('/api/courses')
}

export function getCourse(courseId: string): Promise<{ course: CourseDetail }> {
  return getJson(`/api/courses/${courseId}`)
}

export function getLesson(lessonId: string): Promise<{ lesson: LessonDetail }> {
  return getJson(`/api/lessons/${lessonId}`)
}
