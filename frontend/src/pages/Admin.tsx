import { useEffect, useState } from 'react'
import { assignVideoToLesson, getCourse, listCourses, listUnassignedVideos, triggerYoutubeSync } from '../lib/api'
import type { CourseSummary, SyncResult, UnassignedVideo, UnitWithLessons } from '../lib/types'

export default function Admin() {
  const [videos, setVideos] = useState<UnassignedVideo[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assigningVideoId, setAssigningVideoId] = useState<string | null>(null)
  const [assignNote, setAssignNote] = useState<string | null>(null)

  const refreshVideos = () => listUnassignedVideos().then(setVideos).catch(() => setError('Could not load unassigned videos.'))

  useEffect(() => {
    refreshVideos()
    listCourses()
      .then((data) => setCourses(data.courses))
      .catch(() => setError('Could not load courses.'))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const result = await triggerYoutubeSync()
      setSyncResult(result)
      await refreshVideos()
    } catch {
      setError('Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="admin-page section-shell">
      <h1>Admin: curate videos</h1>

      <button className="button button-primary" onClick={() => void handleSync()} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync YouTube channel'}
      </button>
      {syncResult && (
        <p className="admin-sync-result">
          Found {syncResult.channelVideosFound} video{syncResult.channelVideosFound === 1 ? '' : 's'} on the channel
          &nbsp;({syncResult.newVideos} new, {syncResult.updatedVideos} updated).
        </p>
      )}
      {error && <p className="auth-error">{error}</p>}

      <h2 className="admin-section-title">Unassigned videos ({videos.length})</h2>
      {assignNote && <p className="admin-sync-result">{assignNote}</p>}
      {videos.length === 0 && <p>No unassigned videos right now.</p>}
      <div className="admin-video-list">
        {videos.map((video) => (
          <div key={video.id} className="admin-video-card">
            <img src={video.thumbnailUrl} alt="" />
            <div className="admin-video-info">
              <strong>{video.title}</strong>
              {!video.embeddable && <span className="admin-warning">Not embeddable</span>}
              {video.privacyStatus !== 'public' && <span className="admin-warning">{video.privacyStatus}</span>}
              {assigningVideoId === video.id ? (
                <AssignForm
                  video={video}
                  courses={courses}
                  onDone={(practiceGenerated) => {
                    setAssigningVideoId(null)
                    setAssignNote(
                      practiceGenerated
                        ? 'Lesson created and a practice quiz was generated.'
                        : 'Lesson created, but the practice quiz could not be generated — check the server logs.',
                    )
                    void refreshVideos()
                  }}
                  onCancel={() => setAssigningVideoId(null)}
                />
              ) : (
                <button className="button" onClick={() => setAssigningVideoId(video.id)}>
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
    if (!courseId) {
      setUnits([])
      setUnitId('')
      return
    }
    getCourse(courseId)
      .then((data) => setUnits(data.course.units))
      .catch(() => setUnits([]))
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
      {error && <p className="auth-error">{error}</p>}
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
