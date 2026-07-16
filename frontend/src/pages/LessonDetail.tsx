import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLesson, getPracticeSession } from '../lib/api'
import type { LessonDetail as LessonDetailData, PracticeSession } from '../lib/types'
import VideoEmbed from '../components/VideoEmbed'
import { useAuth } from '../lib/authContext'
import { useProgress } from '../lib/progressContext'

export default function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<LessonDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [practice, setPractice] = useState<PracticeSession | null>(null)
  const { user } = useAuth()
  const { isComplete, toggleComplete } = useProgress()

  useEffect(() => {
    if (!lessonId) return
    setLesson(null)
    setPractice(null)
    getLesson(lessonId)
      .then((data) => setLesson(data.lesson))
      .catch(() => setError('Could not load this lesson right now.'))
    getPracticeSession(lessonId)
      .then(setPractice)
      .catch(() => setPractice(null))
  }, [lessonId])

  if (error) return <main className="page-status">{error}</main>
  if (!lesson) return <main className="page-status">Loading lesson…</main>

  const complete = isComplete(lesson.id)

  return (
    <main className="lesson-detail section-shell">
      <p className="eyebrow">
        <span></span>
        <Link to={`/courses/${lesson.course.id}`}>{lesson.course.title}</Link> · {lesson.unit.title}
      </p>
      <h1>{lesson.title}</h1>
      <VideoEmbed youtubeVideoId={lesson.video.youtubeVideoId} title={lesson.video.title} />
      <p className="lesson-summary">{lesson.summary}</p>

      {user ? (
        <button
          className={complete ? 'button button-complete' : 'button button-primary'}
          onClick={() => void toggleComplete(lesson.id)}
        >
          {complete ? '✓ Completed' : 'Mark as complete'}
        </button>
      ) : (
        <p className="lesson-signin-prompt">
          <Link to="/login">Sign in</Link> to track your progress on this lesson.
        </p>
      )}

      {practice &&
        (user ? (
          <div className="practice-card">
            <div>
              <strong>🎮 Practice this lesson</strong>
              <p>{practice.questions.length} questions · earn XP and build your streak</p>
            </div>
            <Link className="button button-primary" to={`/lessons/${lesson.id}/practice`}>
              Start practice
            </Link>
          </div>
        ) : (
          <p className="lesson-signin-prompt">
            <Link to="/login">Sign in</Link> to unlock the practice quiz for this lesson.
          </p>
        ))}

      <nav className="lesson-nav">
        {lesson.prevLessonId ? <Link to={`/lessons/${lesson.prevLessonId}`}>&larr; Previous lesson</Link> : <span />}
        {lesson.nextLessonId ? <Link to={`/lessons/${lesson.nextLessonId}`}>Next lesson &rarr;</Link> : <span />}
      </nav>
    </main>
  )
}
