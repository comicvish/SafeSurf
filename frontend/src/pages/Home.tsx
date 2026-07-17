import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../lib/api'
import type { CourseSummary } from '../lib/types'

export default function Home() {
  const [courses, setCourses] = useState<CourseSummary[]>([])

  useEffect(() => {
    listCourses()
      .then((data) => setCourses(data.courses))
      .catch(() => setCourses([]))
  }, [])

  return (
    <main>
      <section className="hero-shell">
        <div className="hero">
          <p className="eyebrow">
            <span></span> Free internet safety education
          </p>
          <h1>Learn to stay safe online.</h1>
          <p className="hero-text">
            VeraBlock teaches practical internet-security skills through short video lessons — and brings a live,
            in-person course to senior living communities and similar spaces.
          </p>
          <div className="hero-paths">
            <div className="hero-path-card hero-path-card--light">
              <h2>Free video courses</h2>
              <p>
                Short lessons on real threats — scams, AI-generated content, weak passwords — free to watch any
                time, no account needed to start.
              </p>
              <Link className="button button-primary" to="/courses">
                Browse courses
              </Link>
            </div>
            <div className="hero-path-card hero-path-card--dark">
              <p className="eyebrow">
                <span></span> For senior living communities
              </p>
              <h2>In-person courses</h2>
              <p>
                Our team leads a live, four-week course on-site — covering spam calls, AI voices, and AI-generated
                images and video.
              </p>
              <Link className="button button-primary" to="/in-person-courses">
                Learn about the in-person course
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="value-props section-shell">
        <div className="value-prop">
          <h3>Free, always</h3>
          <p>Every lesson is free to watch. No paywalls, no sign-up required to learn.</p>
        </div>
        <div className="value-prop">
          <h3>Built for real threats</h3>
          <p>Scams, AI-generated content, weak passwords — the things that actually put people at risk today.</p>
        </div>
        <div className="value-prop">
          <h3>Go at your pace</h3>
          <p>Short video lessons in a clear order, with your progress saved as you go.</p>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="featured-courses section-shell">
          <h2>Start learning</h2>
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
        </section>
      )}
    </main>
  )
}
