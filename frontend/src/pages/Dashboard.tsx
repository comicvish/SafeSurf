import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourseDetails } from '../lib/api'
import { useAuth } from '../lib/authContext'
import { useProgress } from '../lib/progressContext'
import { useStats } from '../lib/statsContext'
import type { CourseDetail } from '../lib/types'

const PAGE_TITLE = 'My progress | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

export default function Dashboard() {
  const { user } = useAuth()
  const { completedLessonIds } = useProgress()
  const { stats } = useStats()
  const [courses, setCourses] = useState<CourseDetail[] | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    document.title = PAGE_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  useEffect(() => {
    let active = true
    setCourses(null)
    setCoursesError(null)
    // One batched request for every course's full unit/lesson tree, instead
    // of listing courses then fetching each one individually.
    listCourseDetails()
      .then((data) => {
        if (active) setCourses(data.courses)
      })
      .catch(() => {
        if (active) setCoursesError('Could not load your courses right now.')
      })
    return () => {
      active = false
    }
  }, [retryCount])

  const allSettled = courses !== null
  const totalLessons = (courses ?? []).reduce((sum, c) => sum + c.units.reduce((s, u) => s + u.lessons.length, 0), 0)

  // First lesson, in curriculum order, that isn't complete yet — the "pick
  // up where you left off" prompt.
  const nextLesson = (courses ?? [])
    .flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ course, lesson }))))
    .find(({ lesson }) => !completedLessonIds.has(lesson.id))

  return (
    <main className="dashboard section-shell">
      <h1>My progress</h1>
      <p className="dashboard-user">Signed in as {user?.email}</p>
      {allSettled && !coursesError && (
        <p className="dashboard-summary">
          {completedLessonIds.size} of {totalLessons} lessons complete
        </p>
      )}

      <div className="stats-row">
        <div className="stat-tile">
          <strong>{stats.xp}</strong>
          <span>Total XP</span>
        </div>
        <div className="stat-tile">
          <strong>{stats.currentStreak}</strong>
          <span>Day streak</span>
        </div>
        <div className="stat-tile">
          <strong>{stats.longestStreak}</strong>
          <span>Longest streak</span>
        </div>
      </div>

      {coursesError && (
        <div className="page-status page-status--column">
          <p className="auth-error">{coursesError}</p>
          <button className="button button-primary" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {!coursesError && allSettled && courses.length === 0 && (
        <p className="course-load-error">No courses are available right now.</p>
      )}

      {!coursesError && courses === null && (
        <div aria-busy="true" aria-label="Loading your courses">
          {Array.from({ length: 2 }, (_, index) => (
            <div className="unit-block" key={`initial-${index}`} aria-hidden="true">
              <span className="skeleton-line skeleton-line--unit-title" />
              <div className="lesson-list-skeleton">
                {Array.from({ length: 3 }, (_, lessonIndex) => (
                  <span className="skeleton-line skeleton-line--lesson-row" key={lessonIndex} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!coursesError && courses !== null && courses.length > 0 && (
        <>
          {nextLesson && (
            <div className="practice-card dashboard-continue-card">
              <div>
                <strong>Continue learning</strong>
                <p>
                  {nextLesson.course.title} &middot; {nextLesson.lesson.title}
                </p>
              </div>
              <Link className="button button-primary" to={`/lessons/${nextLesson.lesson.id}`}>
                Continue
              </Link>
            </div>
          )}

          <div className="dashboard-progress-grid" aria-label="Progress by course">
            {courses.map((course) => {
              const courseTotal = course.units.reduce((sum, u) => sum + u.lessons.length, 0)
              const courseComplete = course.units.reduce(
                (sum, u) => sum + u.lessons.filter((l) => completedLessonIds.has(l.id)).length,
                0,
              )
              const fraction = courseTotal > 0 ? courseComplete / courseTotal : 0
              const status = courseTotal === 0 ? 'Start course' : fraction >= 1 ? 'Review course' : courseComplete > 0 ? 'Continue course' : 'Start course'

              return (
                <div className="dashboard-course-card" key={course.id}>
                  <div className="dashboard-course-card-header">
                    <h2>{course.title}</h2>
                    <span>
                      {courseComplete} of {courseTotal} lesson{courseTotal === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="practice-progress">
                    <div className="practice-progress-bar" style={{ transform: `scaleX(${fraction})` }} />
                  </div>
                  <Link className="button button-secondary" to={`/courses/${course.id}`}>
                    {status}
                  </Link>
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
