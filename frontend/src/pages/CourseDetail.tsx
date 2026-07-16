import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../lib/api'
import type { CourseDetail as CourseDetailData } from '../lib/types'

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    setCourse(null)
    getCourse(courseId)
      .then((data) => setCourse(data.course))
      .catch(() => setError('Could not load this course right now.'))
  }, [courseId])

  if (error) return <main className="page-status">{error}</main>
  if (!course) return <main className="page-status">Loading course…</main>

  return (
    <main className="course-detail section-shell">
      <h1>{course.title}</h1>
      <p className="course-description">{course.description}</p>
      {course.units.map((unit) => (
        <section key={unit.id} className="unit-block">
          <h2>{unit.title}</h2>
          <ol className="lesson-list">
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link to={`/lessons/${lesson.id}`}>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  )
}
