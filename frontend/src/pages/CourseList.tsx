import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../lib/api'
import type { CourseSummary } from '../lib/types'

export default function CourseList() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCourses()
      .then((data) => setCourses(data.courses))
      .catch(() => setError('Could not load courses right now.'))
  }, [])

  if (error) return <main className="page-status">{error}</main>
  if (!courses) return <main className="page-status">Loading courses…</main>

  return (
    <main className="course-list section-shell">
      <h1>Courses</h1>
      <div className="course-grid">
        {courses.map((course) => (
          <Link key={course.id} className="course-card" to={`/courses/${course.id}`}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <span>
              {course.unitCount} unit{course.unitCount === 1 ? '' : 's'} · {course.lessonCount} lesson
              {course.lessonCount === 1 ? '' : 's'}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
