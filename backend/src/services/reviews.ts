import { db } from './firestore.js'
import type { DueReview, ReviewAnalytics, ReviewEventDoc, ReviewScheduleDoc, UserStatsDoc } from '../types.js'
import { getLessonSummaries } from './content.js'

// Leitner-style ladder: passing a due review advances a stage, failing
// resets to 0. Deliberately simpler than SM-2 (no ease factors) to match
// stats.ts's plain date-diff streak logic rather than pull in a spaced-
// repetition library for this.
const REVIEW_STAGE_INTERVAL_DAYS = [1, 3, 7, 21, 60]
const REVIEW_PASS_THRESHOLD = 0.6
// Well below the ~70 XP available for a first perfect completion, so
// reviewing can't be farmed into a bigger reward than learning something new.
const REVIEW_XP = 15

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDaysUtc(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() + days * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

export async function recordLessonPracticed(
  uid: string,
  lessonId: string,
  correctCount: number,
  totalQuestions: number,
): Promise<{ xpEarned: number; xp: number } | null> {
  const userRef = db.collection('users').doc(uid)
  const scheduleRef = userRef.collection('reviewSchedule').doc(lessonId)
  const today = todayUtc()

  return db.runTransaction(async (tx) => {
    // Firestore transactions require every read before any write, so both
    // docs are read upfront regardless of which branch below ends up writing.
    const [scheduleSnap, userSnap] = await Promise.all([tx.get(scheduleRef), tx.get(userRef)])

    if (!scheduleSnap.exists) {
      // First-ever completion of this lesson's quiz — seed the ladder at
      // stage 0. The existing first-completion XP bonus in stats.ts already
      // rewards this, so no bonus here.
      tx.set(scheduleRef, {
        lessonId,
        stage: 0,
        nextDueAt: addDaysUtc(today, REVIEW_STAGE_INTERVAL_DAYS[0]),
        lastReviewedAt: new Date().toISOString(),
      } satisfies ReviewScheduleDoc)
      return null
    }

    const schedule = scheduleSnap.data() as ReviewScheduleDoc
    if (today < schedule.nextDueAt) {
      // Not due yet — an ordinary "Try again" replay, same as today's
      // behavior of retries earning 0 XP.
      return null
    }

    const passed = correctCount / totalQuestions >= REVIEW_PASS_THRESHOLD
    const nextStage = passed ? Math.min(schedule.stage + 1, REVIEW_STAGE_INTERVAL_DAYS.length - 1) : 0
    tx.set(scheduleRef, {
      lessonId,
      stage: nextStage,
      nextDueAt: addDaysUtc(today, REVIEW_STAGE_INTERVAL_DAYS[nextStage]),
      lastReviewedAt: new Date().toISOString(),
    } satisfies ReviewScheduleDoc)

    tx.set(userRef.collection('reviewEvents').doc(), {
      lessonId,
      passed,
      stageBefore: schedule.stage,
      stageAfter: nextStage,
      at: new Date().toISOString(),
    } satisfies ReviewEventDoc)

    const existingXp = userSnap.exists ? (userSnap.data() as UserStatsDoc).xp : 0
    const xp = existingXp + REVIEW_XP
    tx.set(userRef, { xp }, { merge: true })

    return { xpEarned: REVIEW_XP, xp }
  })
}

export async function getDueReviews(uid: string): Promise<{ lessonId: string; nextDueAt: string }[]> {
  const userRef = db.collection('users').doc(uid)
  const today = todayUtc()

  const [dueSnap, resultsSnap, scheduleSnap] = await Promise.all([
    userRef.collection('reviewSchedule').where('nextDueAt', '<=', today).get(),
    userRef.collection('practiceResults').select().get(),
    userRef.collection('reviewSchedule').select().get(),
  ])

  const due = new Map<string, string>()
  dueSnap.forEach((doc) => due.set(doc.id, (doc.data() as ReviewScheduleDoc).nextDueAt))

  // Backfill: a lesson completed before this feature shipped has a
  // practiceResults doc but no reviewSchedule doc yet. Treat it as due now
  // rather than waiting for a fresh completion to seed the ladder — that
  // existing material is exactly what most needs reinforcing first.
  const scheduledIds = new Set(scheduleSnap.docs.map((doc) => doc.id))
  resultsSnap.forEach((doc) => {
    if (!scheduledIds.has(doc.id) && !due.has(doc.id)) due.set(doc.id, today)
  })

  return [...due.entries()].map(([lessonId, nextDueAt]) => ({ lessonId, nextDueAt }))
}

// Shared by the /reviews/due route and getReminderCandidates below — joins
// getDueReviews' bare {lessonId, nextDueAt} pairs with lesson title/summary/
// keyRule so both only need to describe the join once.
export async function resolveDueReviews(uid: string): Promise<DueReview[]> {
  const due = await getDueReviews(uid)
  const summaries = await getLessonSummaries(due.map((d) => d.lessonId))
  const summaryById = new Map(summaries.map((s) => [s.id, s]))

  return due
    .map(({ lessonId, nextDueAt }) => {
      const summary = summaryById.get(lessonId)
      if (!summary) return null
      return {
        lessonId,
        title: summary.title,
        summary: summary.summary,
        ...(summary.keyRule ? { keyRule: summary.keyRule } : {}),
        nextDueAt,
      }
    })
    .filter((review): review is DueReview => review !== null)
}

// Plain collection-group scans, no filters — no new Firestore composite
// index needed (same reasoning as getDueReviews's queries).
export async function getReviewAnalytics(): Promise<ReviewAnalytics> {
  const [eventsSnap, scheduleSnap] = await Promise.all([
    db.collectionGroup('reviewEvents').get(),
    db.collectionGroup('reviewSchedule').get(),
  ])

  const passCountByStage = new Map<number, number>()
  const totalCountByStage = new Map<number, number>()
  eventsSnap.forEach((doc) => {
    const event = doc.data() as ReviewEventDoc
    totalCountByStage.set(event.stageBefore, (totalCountByStage.get(event.stageBefore) ?? 0) + 1)
    if (event.passed) passCountByStage.set(event.stageBefore, (passCountByStage.get(event.stageBefore) ?? 0) + 1)
  })

  const passRateByStage: Record<number, number> = {}
  totalCountByStage.forEach((total, stage) => {
    passRateByStage[stage] = (passCountByStage.get(stage) ?? 0) / total
  })

  const stageDistribution: Record<number, number> = {}
  scheduleSnap.forEach((doc) => {
    const { stage } = doc.data() as ReviewScheduleDoc
    stageDistribution[stage] = (stageDistribution[stage] ?? 0) + 1
  })

  return { totalReviewsCompleted: eventsSnap.size, passRateByStage, stageDistribution }
}

const REMINDER_COOLDOWN_DAYS = 7

// Sweeps distinct uids from practiceResults (the broadest "has completed
// something" set, consistent with the backfill logic in getDueReviews above)
// and resolves each one's current due list, skipping anyone opted out, on
// cooldown, or with nothing due.
export async function getReminderCandidates(): Promise<{ uid: string; dueLessons: DueReview[] }[]> {
  const practiceResultsSnap = await db.collectionGroup('practiceResults').get()
  const uids = new Set<string>()
  practiceResultsSnap.forEach((doc) => {
    const parentUserRef = doc.ref.parent.parent
    if (parentUserRef) uids.add(parentUserRef.id)
  })

  const today = todayUtc()
  const candidates: { uid: string; dueLessons: DueReview[] }[] = []

  for (const uid of uids) {
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.exists ? (userSnap.data() as UserStatsDoc) : undefined
    if (userData?.emailRemindersOptOut) continue
    if (userData?.lastReminderEmailSentAt && addDaysUtc(userData.lastReminderEmailSentAt.slice(0, 10), REMINDER_COOLDOWN_DAYS) > today) {
      continue
    }

    const dueLessons = await resolveDueReviews(uid)
    if (dueLessons.length > 0) candidates.push({ uid, dueLessons })
  }

  return candidates
}
