import { useEffect, useRef, useState } from 'react'
import {
  assignVideoToLesson,
  getCourse,
  listCourses,
  listUnassignedVideos,
  suggestLessonAssignment,
  triggerYoutubeSync,
} from '../lib/api'
import type { CourseSummary, LessonAssignmentSuggestion, SyncResult, UnassignedVideo, UnitWithLessons } from '../lib/types'

export default function Admin() {
  const [videos, setVideos] = useState<UnassignedVideo[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [videosError, setVideosError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [assigningVideoIds, setAssigningVideoIds] = useState<Set<string>>(new Set())
  const [assignNote, setAssignNote] = useState<string | null>(null)

  // refreshVideos() and loadMoreVideos() can both be in flight at once (e.g.
  // a "load more" request is still pending when assigning a video triggers a
  // refresh) — this guards against a slower, stale response overwriting a
  // newer one, regardless of which resolves last.
  const videosRequestId = useRef(0)

  const refreshVideos = () => {
    const requestId = ++videosRequestId.current
    setVideosError(null)
    return listUnassignedVideos()
      .then((page) => {
        if (videosRequestId.current !== requestId) return
        setVideos(page.videos)
        setNextCursor(page.nextCursor)
      })
      .catch(() => {
        if (videosRequestId.current === requestId) setVideosError('Could not load unassigned videos.')
      })
  }

  const loadMoreVideos = async () => {
    if (!nextCursor) return
    const requestId = ++videosRequestId.current
    setLoadingMore(true)
    try {
      const page = await listUnassignedVideos({ cursor: nextCursor })
      if (videosRequestId.current !== requestId) return
      setVideos((prev) => [...prev, ...page.videos])
      setNextCursor(page.nextCursor)
    } catch {
      if (videosRequestId.current === requestId) setVideosError('Could not load more videos.')
    } finally {
      if (videosRequestId.current === requestId) setLoadingMore(false)
    }
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
          &nbsp;({syncResult.newVideos} new, {syncResult.updatedVideos} updated
          {syncResult.failedVideos > 0 ? `, ${syncResult.failedVideos} failed` : ''}).
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

      <h2 className="admin-section-title">Unassigned videos (showing {videos.length})</h2>
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
      {nextCursor && (
        <button className="button button-secondary" onClick={() => void loadMoreVideos()} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more videos'}
        </button>
      )}
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
  const [suggestion, setSuggestion] = useState<LessonAssignmentSuggestion | null>(null)
  const [suggestionLoading, setSuggestionLoading] = useState(true)

  // Fetches an AI-suggested course/unit/order/summary once, on mount, and
  // pre-fills the form with it — the admin still reviews and confirms (or
  // edits) before anything is actually created. Silent on failure: this is a
  // convenience, not a requirement, so the form just stays empty as before.
  useEffect(() => {
    let active = true
    suggestLessonAssignment(video.id)
      .then((data) => {
        if (!active) return
        setSuggestion(data.suggestion)
        if (data.suggestion.summary) setSummary(data.suggestion.summary)
        if (data.suggestion.courseId) setCourseId(data.suggestion.courseId)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSuggestionLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id])

  useEffect(() => {
    setUnitId('')
    if (!courseId) {
      setUnits([])
      return
    }
    let active = true
    getCourse(courseId)
      .then((data) => {
        if (!active) return
        setUnits(data.course.units)
        if (suggestion?.courseId === courseId && suggestion.unitId) {
          setUnitId(suggestion.unitId)
        }
      })
      .catch(() => {
        if (active) setUnits([])
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  useEffect(() => {
    const unit = units.find((u) => u.id === unitId)
    if (unit) setOrder(unit.lessons.length + 1)
  }, [unitId, units])

  // Declared after the effect above so it runs later in the same commit —
  // its setOrder call is what actually sticks, overriding the default
  // end-of-unit position with the AI's suggested one when it applies to the
  // currently-selected unit.
  useEffect(() => {
    if (suggestion?.unitId === unitId && suggestion.order !== null) {
      setOrder(suggestion.order)
    }
  }, [unitId, suggestion])

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
      {suggestionLoading ? (
        <p className="admin-ai-suggestion-note" role="status">
          Asking AI where this video fits…
        </p>
      ) : (
        suggestion?.reasoning && (
          <p className="admin-ai-suggestion-note">
            <strong>AI suggestion:</strong> {suggestion.reasoning} Review before assigning.
          </p>
        )
      )}
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
