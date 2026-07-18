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
  const [progressError, setProgressError] = useState<string | null>(null)
  const [progressAnnouncement, setProgressAnnouncement] = useState('')
  const [practice, setPractice] = useState<PracticeSession | null>(null)
  const [practiceLoadFailed, setPracticeLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { user } = useAuth()
  const { isComplete, toggleComplete } = useProgress()

  useEffect(() => {
    if (!lessonId) return
    let active = true
    setLesson(null)
    setPractice(null)
    setError(null)
    setProgressError(null)
    setPracticeLoadFailed(false)
    getLesson(lessonId)
      .then((data) => {
        if (active) setLesson(data.lesson)
      })
      .catch(() => {
        if (active) setError('Could not load this lesson right now.')
      })
    getPracticeSession(lessonId)
      .then((session) => {
        if (active) setPractice(session)
      })
      .catch(() => {
        if (active) setPracticeLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [lessonId, retryCount])

  if (error) {
    return (
      <main className="page-status page-status--column">
        <p>{error}</p>
        <button className="button button-primary" onClick={() => setRetryCount((count) => count + 1)}>
          Try again
        </button>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="lesson-detail section-shell" aria-busy="true" aria-label="Loading lesson">
        <span className="skeleton-line skeleton-line--eyebrow" aria-hidden="true" />
        <span className="skeleton-line skeleton-line--title" aria-hidden="true" />
        <div className="video-embed video-embed--skeleton" aria-hidden="true" />
        <span className="skeleton-line" aria-hidden="true" />
        <span className="skeleton-line skeleton-line--body-short" aria-hidden="true" />
      </main>
    )
  }

  const complete = isComplete(lesson.id)

  const handleToggleComplete = () => {
    setProgressError(null)
    const nextComplete = !complete
    toggleComplete(lesson.id)
      .then((ok) => {
        if (ok) {
          setProgressAnnouncement(nextComplete ? 'Lesson marked complete.' : 'Lesson marked not complete.')
        } else {
          setProgressError("Couldn't save that — please try again.")
        }
      })
      .catch(() => setProgressError("Couldn't save that — please try again."))
  }

  return (
    <main className="lesson-detail section-shell">
      <Link className="back-link" to={`/courses/${lesson.course.id}`}>
        &larr; Back to {lesson.course.title}
      </Link>
      <p className="eyebrow">
        <span aria-hidden="true"></span>
        <Link to={`/courses/${lesson.course.id}`}>{lesson.course.title}</Link> · {lesson.unit.title}
      </p>
      <h1>{lesson.title}</h1>
      <VideoEmbed youtubeVideoId={lesson.video.youtubeVideoId} title={lesson.video.title} />
      <p className="lesson-summary">{lesson.summary}</p>

      {user ? (
        <div className="lesson-progress">
          {complete ? (
            <div className="lesson-complete-row">
              <span className="lesson-complete-badge">✓ Completed</span>
              <button className="text-link" onClick={handleToggleComplete}>
                Mark as not complete
              </button>
            </div>
          ) : (
            <button className="button button-primary" onClick={handleToggleComplete}>
              Mark as complete
            </button>
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {progressAnnouncement}
          </span>
          {progressError && (
            <p className="auth-error" role="alert">
              {progressError}
            </p>
          )}
        </div>
      ) : (
        <div className="lesson-signin-prompt">
          <p>Sign in to track your progress on this lesson.</p>
          <Link className="button button-primary" to="/login">
            Sign in
          </Link>
        </div>
      )}

      {practice &&
        (user ? (
          <div className="practice-card">
            <div>
              <strong>Practice this lesson</strong>
              <p>{practice.questions.length} questions · earn XP and build your streak</p>
            </div>
            <Link className="button button-primary" to={`/lessons/${lesson.id}/practice`}>
              Start practice
            </Link>
          </div>
        ) : (
          <div className="lesson-signin-prompt">
            <p>Sign in to unlock the practice quiz for this lesson.</p>
            <Link className="button button-primary" to="/login">
              Sign in
            </Link>
          </div>
        ))}

      {practiceLoadFailed && <p className="course-load-error">Couldn't check for a practice quiz — try refreshing.</p>}

      <nav className="lesson-nav">
        {lesson.prevLessonId ? (
          <Link to={`/lessons/${lesson.prevLessonId}`}>&larr; Previous lesson</Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {lesson.nextLessonId ? (
          <Link to={`/lessons/${lesson.nextLessonId}`}>Next lesson &rarr;</Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>
    </main>
  )
}
