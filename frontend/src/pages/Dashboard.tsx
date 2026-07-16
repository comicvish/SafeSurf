import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourse, listCourses } from '../lib/api'
import { useAuth } from '../lib/authContext'
import { useProgress } from '../lib/progressContext'
import { useStats } from '../lib/statsContext'
import type { CourseDetail } from '../lib/types'

export default function Dashboard() {
  const { user, signOutUser } = useAuth()
  const { completedLessonIds } = useProgress()
  const { stats } = useStats()
  const [courses, setCourses] = useState<CourseDetail[] | null>(null)

  useEffect(() => {
    listCourses()
      .then((data) => Promise.all(data.courses.map((c) => getCourse(c.id).then((r) => r.course))))
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [])

  const totalLessons = courses?.reduce((sum, c) => sum + c.units.reduce((s, u) => s + u.lessons.length, 0), 0) ?? 0

  return (
    <main className="dashboard section-shell">
      <h1>My progress</h1>
      <p className="dashboard-user">
        Signed in as {user?.email} · <button className="text-link" onClick={() => void signOutUser()}>Sign out</button>
      </p>
      <p className="dashboard-summary">
        {completedLessonIds.size} of {totalLessons} lessons complete
      </p>

      <div className="stats-row">
        <div className="stat-tile">
          <strong>{stats.xp}</strong>
          <span>Total XP</span>
        </div>
        <div className="stat-tile">
          <strong>🔥 {stats.currentStreak}</strong>
          <span>Day streak</span>
        </div>
        <div className="stat-tile">
          <strong>{stats.longestStreak}</strong>
          <span>Longest streak</span>
        </div>
      </div>

      {!courses && <p>Loading…</p>}

      {courses?.map((course) => (
        <section key={course.id} className="unit-block">
          <h2>
            <Link to={`/courses/${course.id}`}>{course.title}</Link>
          </h2>
          <ul className="lesson-list">
            {course.units.flatMap((unit) =>
              unit.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link to={`/lessons/${lesson.id}`}>
                    <strong>
                      {completedLessonIds.has(lesson.id) ? '✓ ' : ''}
                      {lesson.title}
                    </strong>
                    <span>{unit.title}</span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      ))}
    </main>
  )
}
