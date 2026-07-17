import { db } from './firestore.js'
import type { PracticeResultDoc, PracticeSubmitResult, UserStats, UserStatsDoc } from '../types.js'

const XP_PER_CORRECT_ANSWER = 10
const PERFECT_SCORE_BONUS_XP = 20

const DEFAULT_STATS: UserStats = { xp: 0, currentStreak: 0, longestStreak: 0 }

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function isConsecutiveDay(previous: string, current: string): boolean {
  const prevDate = new Date(`${previous}T00:00:00Z`).getTime()
  const currDate = new Date(`${current}T00:00:00Z`).getTime()
  return Math.round((currDate - prevDate) / 86_400_000) === 1
}

export async function getUserStats(uid: string): Promise<UserStats> {
  const snap = await db.collection('users').doc(uid).get()
  if (!snap.exists) return DEFAULT_STATS
  const data = snap.data() as UserStatsDoc
  return { xp: data.xp, currentStreak: data.currentStreak, longestStreak: data.longestStreak }
}

export async function recordPracticeCompletion(
  uid: string,
  lessonId: string,
  correctCount: number,
  totalQuestions: number,
): Promise<PracticeSubmitResult> {
  const userRef = db.collection('users').doc(uid)
  const resultRef = userRef.collection('practiceResults').doc(lessonId)

  return db.runTransaction(async (tx) => {
    const [userSnap, resultSnap] = await Promise.all([tx.get(userRef), tx.get(resultRef)])
    const existing: UserStatsDoc = userSnap.exists
      ? (userSnap.data() as UserStatsDoc)
      : { ...DEFAULT_STATS, lastPracticeDate: null }

    // XP is only awarded the first time a lesson's quiz is completed —
    // otherwise "Try again" would let someone farm unlimited XP by
    // resubmitting the same quiz over and over.
    const isFirstCompletion = !resultSnap.exists
    const xpEarned = isFirstCompletion
      ? correctCount * XP_PER_CORRECT_ANSWER + (correctCount === totalQuestions ? PERFECT_SCORE_BONUS_XP : 0)
      : 0

    const today = todayUtc()
    let currentStreak = existing.currentStreak
    if (existing.lastPracticeDate === today) {
      // already practiced today — streak unchanged
    } else if (existing.lastPracticeDate && isConsecutiveDay(existing.lastPracticeDate, today)) {
      currentStreak += 1
    } else {
      currentStreak = 1
    }
    const longestStreak = Math.max(existing.longestStreak, currentStreak)
    const xp = existing.xp + xpEarned

    const updated: UserStatsDoc = { xp, currentStreak, longestStreak, lastPracticeDate: today }
    tx.set(userRef, updated, { merge: true })

    tx.set(resultRef, {
      lessonId,
      score: correctCount,
      totalQuestions,
      xpEarned,
      completedAt: new Date().toISOString(),
    } satisfies PracticeResultDoc)

    return {
      score: correctCount,
      totalQuestions,
      xpEarned,
      stats: { xp, currentStreak, longestStreak },
    }
  })
}
