export interface CourseSummary {
  id: string
  title: string
  description: string
  order: number
  unitCount: number
  lessonCount: number
}

export interface UnitWithLessons {
  id: string
  title: string
  order: number
  lessons: { id: string; title: string; order: number; summary: string; hasVideo: boolean }[]
}

export interface CourseDetail {
  id: string
  title: string
  description: string
  units: UnitWithLessons[]
}

export interface LessonDetail {
  id: string
  title: string
  summary: string
  keyRule?: string
  video: { youtubeVideoId: string; title: string; description: string }
  unit: { id: string; title: string }
  course: { id: string; title: string }
  prevLessonId: string | null
  nextLessonId: string | null
}

export interface UnassignedVideo {
  id: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string
  embeddable: boolean
  privacyStatus: string
}

export interface UnassignedVideoPage {
  videos: UnassignedVideo[]
  nextCursor: string | null
}

export interface DueReview {
  lessonId: string
  title: string
  summary: string
  nextDueAt: string
}

export interface SyncResult {
  channelVideosFound: number
  newVideos: number
  updatedVideos: number
  failedVideos: number
}

export interface PracticeQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface PracticeSession {
  lessonId: string
  questions: PracticeQuestion[]
}

export interface PracticeAnswerReveal {
  correctIndex: number
  explanation: string
}

export interface UserStats {
  xp: number
  currentStreak: number
  longestStreak: number
}

export interface PracticeSubmitResult {
  score: number
  totalQuestions: number
  xpEarned: number
  stats: UserStats
}

export interface ReviewAnalytics {
  totalReviewsCompleted: number
  passRateByStage: Record<number, number>
  stageDistribution: Record<number, number>
}

export interface FamilyLinkStatus {
  linkId: string
  status: 'pending' | 'active'
  role: 'inviter' | 'accepter'
  otherEmail: string | null
  safeWordConfirmedAt: string | null
}
