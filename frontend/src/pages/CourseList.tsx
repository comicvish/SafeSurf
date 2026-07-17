import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../lib/api'
import type { CourseSummary } from '../lib/types'

const PAGE_TITLE = 'Courses | VeraBlock'
const DEFAULT_TITLE = 'VeraBlock | Learn to stay safe online'

export default function CourseList() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      </main>
    )
  }

  if (courses.length === 0) {
    return (
      <main className="course-list section-shell">
        <h1>Courses</h1>
        <p className="course-load-error">New courses are on the way — check back soon.</p>
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
    </main>
  )
}
