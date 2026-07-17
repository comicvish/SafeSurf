import type {
  CourseDetail,
  CourseSummary,
  LessonDetail,
  PracticeSession,
  PracticeSubmitResult,
  SyncResult,
  UnassignedVideo,
  UserStats,
} from './types'
import { auth } from './firebaseClient'

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
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

export async function getProgress(): Promise<{ completedLessonIds: string[] }> {
  return getJson('/api/progress', { headers: await authHeaders() })
}

export async function setLessonComplete(lessonId: string, completed: boolean): Promise<void> {
  await getJson(`/api/progress/${lessonId}`, {
    method: 'PUT',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
}

export async function checkIsAdmin(): Promise<boolean> {
  const data = await getJson<{ isAdmin: boolean }>('/api/admin/me', { headers: await authHeaders() })
  return data.isAdmin
}

export async function triggerYoutubeSync(): Promise<SyncResult> {
  const data = await getJson<{ result: SyncResult }>('/api/admin/sync-youtube', {
    method: 'POST',
    headers: await authHeaders(),
  })
  return data.result
}

export async function listUnassignedVideos(): Promise<UnassignedVideo[]> {
  const data = await getJson<{ videos: UnassignedVideo[] }>('/api/admin/videos', { headers: await authHeaders() })
  return data.videos
}

export async function assignVideoToLesson(input: {
  unitId: string
  videoId: string
  order: number
  summary: string
}): Promise<{ practiceGenerated: boolean }> {
  return getJson('/api/admin/lessons', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getPracticeSession(lessonId: string): Promise<PracticeSession | null> {
  const res = await fetch(`/api/lessons/${lessonId}/practice`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Request to /api/lessons/${lessonId}/practice failed with ${res.status}`)
  const data = (await res.json()) as { practice: PracticeSession }
  return data.practice
}

export async function submitPractice(lessonId: string, answers: number[]): Promise<PracticeSubmitResult> {
  return getJson(`/api/lessons/${lessonId}/practice/submit`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
}

export async function getStats(): Promise<UserStats> {
  const data = await getJson<{ stats: UserStats }>('/api/stats', { headers: await authHeaders() })
  return data.stats
}

export async function sendInquiry(input: {
  name: string
  email: string
  preferredDate?: string
  message: string
}): Promise<void> {
  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || `Request to /api/inquiries failed with ${res.status}`)
  }
}
