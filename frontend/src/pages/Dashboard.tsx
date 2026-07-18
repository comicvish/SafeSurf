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

      {!coursesError && courses !== null && (
        <div aria-label="Your courses">
          {courses.map((course) => (
            <section key={course.id} className="unit-block">
              <h2>
                <Link to={`/courses/${course.id}`}>{course.title}</Link>
              </h2>
              {course.units.length === 0 && (
                <p className="course-load-error">This course doesn't have any units yet.</p>
              )}
              {course.units.map((unit) => (
                <div key={unit.id} className="dashboard-unit">
                  <h3 className="dashboard-unit-title">{unit.title}</h3>
                  {unit.lessons.length === 0 ? (
                    <p className="course-load-error">Lessons for this unit are coming soon.</p>
                  ) : (
                    <ol className="lesson-list">
                      {unit.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link to={`/lessons/${lesson.id}`}>
                            <strong>
                              {completedLessonIds.has(lesson.id) ? '✓ ' : ''}
                              {lesson.title}
                            </strong>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
