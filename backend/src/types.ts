export interface CourseDoc {
  title: string
  description: string
  order: number
}

export interface UnitDoc {
  courseId: string
  title: string
  order: number
}

export interface VideoDoc {
  youtubeVideoId: string
  title: string
  description: string
  thumbnailUrl: string
  embeddable: boolean
  privacyStatus: string
  status: 'unassigned' | 'assigned'
}

export interface UnassignedVideo {
  id: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string
  embeddable: boolean
  privacyStatus: string
}

export interface LessonDoc {
  unitId: string
  videoId: string
  order: number
  summary: string
}

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
  lessons: { id: string; title: string; order: number; summary: string }[]
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
  video: { youtubeVideoId: string; title: string; description: string }
  unit: { id: string; title: string }
  course: { id: string; title: string }
  prevLessonId: string | null
  nextLessonId: string | null
}

export interface ProgressDoc {
  completed: true
  completedAt: string
}

export interface SyncResult {
  channelVideosFound: number
  newVideos: number
  updatedVideos: number
}

export interface PracticeQuestionDoc {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface PracticeSessionDoc {
  lessonId: string
  questions: PracticeQuestionDoc[]
  generatedAt: string
  model: string
}

export interface PracticeSession {
  lessonId: string
  questions: PracticeQuestionDoc[]
}

export interface UserStatsDoc {
  xp: number
  currentStreak: number
  longestStreak: number
  lastPracticeDate: string | null
}

export interface UserStats {
  xp: number
  currentStreak: number
  longestStreak: number
}

export interface PracticeResultDoc {
  lessonId: string
  score: number
  totalQuestions: number
  xpEarned: number
  completedAt: string
}

export interface PracticeSubmitResult {
  score: number
  totalQuestions: number
  xpEarned: number
  stats: UserStats
}
