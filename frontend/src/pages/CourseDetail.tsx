import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../lib/api'
import type { CourseDetail as CourseDetailData } from '../lib/types'
import { useProgress } from '../lib/progressContext'

const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

type ErrorKind = 'not-found' | 'error'

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseDetailData | null>(null)
  const [error, setError] = useState<ErrorKind | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { completedLessonIds } = useProgress()

  useEffect(() => {
    if (!courseId) {
      setError('not-found')
      return
    }
    let active = true
    setCourse(null)
    setError(null)
    getCourse(courseId)
      .then((data) => {
        if (active) setCourse(data.course)
      })
      .catch((err: unknown) => {
        if (!active) return
        const message = err instanceof Error ? err.message : ''
        setError(message.includes('404') ? 'not-found' : 'error')
      })
    return () => {
      active = false
    }
  }, [courseId, retryCount])

  useEffect(() => {
    document.title = course ? `${course.title} | VeraBlock` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [course])

  if (error === 'not-found') {
    return (
      <main className="coming-soon">
        <h1>Course not found</h1>
        <p>We couldn't find that course.</p>
        <Link className="button button-primary" to="/courses">
          Back to courses
        </Link>
      </main>
    )
  }

  if (error === 'error') {
    return (
      <main className="page-status page-status--column">
        <p>Could not load this course right now.</p>
        <button className="button button-primary" onClick={() => setRetryCount((count) => count + 1)}>
          Try again
        </button>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="course-detail section-shell" aria-busy="true" aria-label="Loading course">
        <span className="skeleton-line skeleton-line--title" aria-hidden="true" />
        <span className="skeleton-line skeleton-line--body-short" aria-hidden="true" />
        {Array.from({ length: 2 }, (_, unitIndex) => (
          <div className="unit-block" key={unitIndex} aria-hidden="true">
            <span className="skeleton-line skeleton-line--unit-title" />
            <div className="lesson-list-skeleton">
              {Array.from({ length: 3 }, (_, lessonIndex) => (
                <span className="skeleton-line skeleton-line--lesson-row" key={lessonIndex} />
              ))}
            </div>
          </div>
        ))}
      </main>
    )
  }

  return (
    <main className="course-detail section-shell">
      <h1>{course.title}</h1>
      <p className="course-description">{course.description}</p>
      {course.units.length === 0 && <p className="course-load-error">This course doesn't have any units yet.</p>}
      {course.units.map((unit) => (
        <section key={unit.id} className="unit-block">
          <h2>{unit.title}</h2>
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
                    <span>{lesson.summary}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </main>
  )
}
