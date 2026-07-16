import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLesson } from '../lib/api'
import type { LessonDetail as LessonDetailData } from '../lib/types'
import VideoEmbed from '../components/VideoEmbed'

export default function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<LessonDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) return
    setLesson(null)
    getLesson(lessonId)
      .then((data) => setLesson(data.lesson))
      .catch(() => setError('Could not load this lesson right now.'))
  }, [lessonId])

  if (error) return <main className="page-status">{error}</main>
  if (!lesson) return <main className="page-status">Loading lesson…</main>

  return (
    <main className="lesson-detail section-shell">
      <p className="eyebrow">
        <span></span>
        <Link to={`/courses/${lesson.course.id}`}>{lesson.course.title}</Link> · {lesson.unit.title}
      </p>
      <h1>{lesson.title}</h1>
      <VideoEmbed youtubeVideoId={lesson.video.youtubeVideoId} title={lesson.video.title} />
      <p className="lesson-summary">{lesson.summary}</p>
      <nav className="lesson-nav">
        {lesson.prevLessonId ? <Link to={`/lessons/${lesson.prevLessonId}`}>&larr; Previous lesson</Link> : <span />}
        {lesson.nextLessonId ? <Link to={`/lessons/${lesson.nextLessonId}`}>Next lesson &rarr;</Link> : <span />}
      </nav>
    </main>
  )
}
