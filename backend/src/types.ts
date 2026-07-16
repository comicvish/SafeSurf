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
}

export interface LessonDoc {
  unitId: string
  videoId: string
  title: string
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
