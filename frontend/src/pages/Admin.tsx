import { useEffect, useState } from 'react'
import { assignVideoToLesson, getCourse, listCourses, listUnassignedVideos, triggerYoutubeSync } from '../lib/api'
import type { CourseSummary, SyncResult, UnassignedVideo, UnitWithLessons } from '../lib/types'

export default function Admin() {
  const [videos, setVideos] = useState<UnassignedVideo[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [videosError, setVideosError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [assigningVideoIds, setAssigningVideoIds] = useState<Set<string>>(new Set())
  const [assignNote, setAssignNote] = useState<string | null>(null)

  const refreshVideos = () => {
    setVideosError(null)
    return listUnassignedVideos()
      .then(setVideos)
      .catch(() => setVideosError('Could not load unassigned videos.'))
  }

  const refreshCourses = () => {
    setCoursesError(null)
    return listCourses()
      .then((data) => setCourses(data.courses))
      .catch(() => setCoursesError('Could not load courses.'))
  }

  useEffect(() => {
    void refreshVideos()
    void refreshCourses()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setVideosError(null)
    try {
      const result = await triggerYoutubeSync()
      setSyncResult(result)
      await refreshVideos()
    } catch {
      setVideosError('Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const openAssignForm = (videoId: string) => {
    setAssigningVideoIds((prev) => new Set(prev).add(videoId))
  }

  const closeAssignForm = (videoId: string) => {
    setAssigningVideoIds((prev) => {
      const next = new Set(prev)
      next.delete(videoId)
      return next
    })
  }

  return (
    <main className="admin-page section-shell">
      <h1>Admin: curate videos</h1>

      <button className="button button-primary" onClick={() => void handleSync()} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync YouTube channel'}
      </button>
      {syncResult && (
        <p className="admin-sync-result" role="status" aria-live="polite">
          Found {syncResult.channelVideosFound} video{syncResult.channelVideosFound === 1 ? '' : 's'} on the channel
          &nbsp;({syncResult.newVideos} new, {syncResult.updatedVideos} updated).
        </p>
      )}
      {coursesError && (
        <p className="auth-error" role="alert">
          {coursesError}{' '}
          <button className="text-link" onClick={() => void refreshCourses()}>
            Try again
          </button>
        </p>
      )}
      {videosError && (
        <p className="auth-error" role="alert">
          {videosError}{' '}
          <button className="text-link" onClick={() => void refreshVideos()}>
            Try again
          </button>
        </p>
      )}

      <h2 className="admin-section-title">Unassigned videos ({videos.length})</h2>
      {assignNote && (
        <p className="admin-sync-result" role="status" aria-live="polite">
          {assignNote}
        </p>
      )}
      {videos.length === 0 && !videosError && <p>No unassigned videos right now.</p>}
      <div className="admin-video-list">
        {videos.map((video) => (
          <div key={video.id} className="admin-video-card">
            <img src={video.thumbnailUrl} alt="" />
            <div className="admin-video-info">
              <strong>{video.title}</strong>
              {!video.embeddable && <span className="admin-warning">Not embeddable</span>}
              {video.privacyStatus !== 'public' && <span className="admin-warning">{video.privacyStatus}</span>}
              {assigningVideoIds.has(video.id) ? (
                <AssignForm
                  video={video}
                  courses={courses}
                  onDone={(practiceGenerated) => {
                    closeAssignForm(video.id)
                    setAssignNote(
                      practiceGenerated
                        ? 'Lesson created and a practice quiz was generated.'
                        : 'Lesson created, but the practice quiz could not be generated — check the server logs.',
                    )
                    void refreshVideos()
                  }}
                  onCancel={() => closeAssignForm(video.id)}
                />
              ) : (
                <button className="button" onClick={() => openAssignForm(video.id)}>
                  Assign to a lesson
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function AssignForm({
  video,
  courses,
  onDone,
  onCancel,
}: {
  video: UnassignedVideo
  courses: CourseSummary[]
  onDone: (practiceGenerated: boolean) => void
  onCancel: () => void
}) {
  const [courseId, setCourseId] = useState('')
  const [units, setUnits] = useState<UnitWithLessons[]>([])
  const [unitId, setUnitId] = useState('')
  const [order, setOrder] = useState(1)
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUnitId('')
    if (!courseId) {
      setUnits([])
      return
    }
    let active = true
    getCourse(courseId)
      .then((data) => {
        if (active) setUnits(data.course.units)
      })
      .catch(() => {
        if (active) setUnits([])
      })
    return () => {
      active = false
    }
  }, [courseId])

  useEffect(() => {
    const unit = units.find((u) => u.id === unitId)
    if (unit) setOrder(unit.lessons.length + 1)
  }, [unitId, units])

  const handleSubmit = async () => {
    if (!unitId || !summary) {
      setError('Unit and summary are required.')
      return
    }
    if (!Number.isInteger(order) || order < 1) {
      setError('Order must be a whole number of 1 or more.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await assignVideoToLesson({ unitId, videoId: video.id, order, summary })
      onDone(result.practiceGenerated)
    } catch {
      setError('Could not assign this video.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-assign-form">
      <label>
        Course
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Unit
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!courseId}>
          <option value="">Select a unit…</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Order within unit
        <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      </label>
      <label>
        Summary
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
      </label>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-assign-actions">
        <button className="button button-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Assigning…' : 'Assign'}
        </button>
        <button className="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
