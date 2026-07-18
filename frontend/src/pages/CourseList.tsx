import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../lib/api'
import type { CourseSummary } from '../lib/types'
import { useAuth } from '../lib/authContext'

const PAGE_TITLE = 'Courses | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'
const SIGNIN_PROMPT_SEEN_KEY = 'vb-courses-signin-prompt-seen'

export default function CourseList() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  useEffect(() => {
    listCourses()
      .then((data) => setCourses(data.courses))
      .catch(() => setError("Couldn't load courses right now — try refreshing the page."))
  }, [])

  useEffect(() => {
    if (loading || user) return
    if (localStorage.getItem(SIGNIN_PROMPT_SEEN_KEY)) return
    setShowSignInPrompt(true)
  }, [loading, user])

  useEffect(() => {
    if (showSignInPrompt) dialogRef.current?.showModal()
  }, [showSignInPrompt])

  const dismissSignInPrompt = () => {
    localStorage.setItem(SIGNIN_PROMPT_SEEN_KEY, '1')
    setShowSignInPrompt(false)
  }

  const signInPromptDialog = showSignInPrompt && (
    <dialog
      ref={dialogRef}
      className="signin-prompt-dialog"
      onClose={dismissSignInPrompt}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const inBounds =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        if (!inBounds) event.currentTarget.close()
      }}
    >
      <h2>Sign in to track your progress</h2>
      <p>Create a free account to save your progress, earn XP, and pick up where you left off. You can also keep browsing without signing in.</p>
      <div className="signin-prompt-actions">
        <Link className="button button-primary" to="/login" onClick={dismissSignInPrompt}>
          Sign in
        </Link>
        <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>
          Continue browsing
        </button>
      </div>
    </dialog>
  )

  if (error) return <main className="page-status">{error}</main>

  if (!courses) {
    return (
      <main className="course-list section-shell">
        <h1>Courses</h1>
        <ul className="course-grid" aria-busy="true" aria-label="Loading courses">
          {Array.from({ length: 3 }, (_, index) => (
            <li className="course-card-skeleton" key={index} aria-hidden="true">
              <span className="skeleton-line skeleton-line--title" />
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-line--body-short" />
              <span className="skeleton-line skeleton-line--meta" />
            </li>
          ))}
        </ul>
        {signInPromptDialog}
      </main>
    )
  }

  if (courses.length === 0) {
    return (
      <main className="course-list section-shell">
        <h1>Courses</h1>
        <p className="course-load-error">New courses are on the way — check back soon.</p>
        {signInPromptDialog}
      </main>
    )
  }

  return (
    <main className="course-list section-shell">
      <h1>Courses</h1>
      <ul className="course-grid" role="list">
        {courses.map((course) => (
          <li key={course.id}>
            <Link className="course-card" to={`/courses/${course.id}`}>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <span>
                {course.unitCount} unit{course.unitCount === 1 ? '' : 's'} · {course.lessonCount} lesson
                {course.lessonCount === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {signInPromptDialog}
    </main>
  )
}
