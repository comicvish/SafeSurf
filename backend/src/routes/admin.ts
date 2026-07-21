import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { requireAdmin, isAdminEmail } from '../middleware/requireAdmin.js'
import { verifySchedulerOrAdmin } from '../middleware/verifySchedulerOrAdmin.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { adminMutationLimiter, authAttemptLimiter, authenticatedLimiter, syncLimiter } from '../middleware/rateLimits.js'
import { syncYoutubeVideos } from '../services/youtube.js'
import { listUnassignedVideos } from '../services/videos.js'
import { assignVideoToExistingLesson, createLesson } from '../services/content.js'
import { generatePracticeSession } from '../services/practice.js'
import { getReviewAnalytics, getReminderCandidates } from '../services/reviews.js'
import { markReminderEmailSent, optOutOfEmailReminders } from '../services/account.js'
import { sendReviewReminderEmail } from '../services/email.js'
import { auth } from '../services/firebaseAdmin.js'

export const adminRouter = Router()

adminRouter.get(
  '/admin/me',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (_req, res) => {
    res.json({ isAdmin: isAdminEmail(res.locals.email) })
  }),
)

adminRouter.post(
  '/admin/sync-youtube',
  authAttemptLimiter,
  verifySchedulerOrAdmin,
  syncLimiter,
  asyncHandler(async (_req, res) => {
    const result = await syncYoutubeVideos()
    res.json({ result })
  }),
)

const SITE_ORIGIN = 'https://verablock.org'

adminRouter.post(
  '/admin/send-review-reminders',
  authAttemptLimiter,
  verifySchedulerOrAdmin,
  syncLimiter,
  asyncHandler(async (req, res) => {
    const dryRun = req.query.dryRun === 'true'
    const candidates = await getReminderCandidates()

    let sent = 0
    let failed = 0
    const recipients: string[] = []

    for (const { uid, dueLessons } of candidates) {
      let email: string | null = null
      try {
        email = (await auth.getUser(uid)).email ?? null
      } catch (err) {
        console.error(`Could not resolve email for uid ${uid}`, err)
      }
      if (!email) {
        failed++
        continue
      }

      recipients.push(email)
      if (dryRun) continue

      try {
        await sendReviewReminderEmail(email, {
          dueLessons,
          dashboardUrl: `${SITE_ORIGIN}/dashboard`,
          unsubscribeUrl: `${SITE_ORIGIN}/api/admin/unsubscribe/${uid}`,
        })
        await markReminderEmailSent(uid)
        sent++
      } catch (err) {
        failed++
        console.error(`Failed to send review reminder to uid ${uid}`, err)
      }
    }

    res.json(dryRun ? { dryRun: true, wouldSend: recipients.length, recipients } : { sent, failed })
  }),
)

// No auth — this is a link clicked from an email client, not an in-app
// action. Not token-signed: the worst case of a forged unsubscribe is that
// someone stops getting a helpful reminder, not a data exposure, so a
// signing scheme isn't worth the complexity here.
adminRouter.get(
  '/admin/unsubscribe/:uid',
  asyncHandler(async (req, res) => {
    await optOutOfEmailReminders(req.params.uid)
    res.type('html').send('<!doctype html><p>You will no longer receive VeraBlock review reminder emails.</p>')
  }),
)

adminRouter.get(
  '/admin/review-analytics',
  authAttemptLimiter,
  verifyFirebaseToken,
  requireAdmin,
  authenticatedLimiter,
  asyncHandler(async (_req, res) => {
    const analytics = await getReviewAnalytics()
    res.json({ analytics })
  }),
)

adminRouter.get(
  '/admin/videos',
  authAttemptLimiter,
  verifyFirebaseToken,
  requireAdmin,
  authenticatedLimiter,
  asyncHandler(async (req, res) => {
    const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
    const limit = limitParam !== undefined && Number.isFinite(limitParam) ? limitParam : undefined
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const page = await listUnassignedVideos({ limit, cursor })
    res.json(page)
  }),
)

adminRouter.post(
  '/admin/lessons',
  authAttemptLimiter,
  verifyFirebaseToken,
  requireAdmin,
  adminMutationLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as { unitId?: unknown; videoId?: unknown; order?: unknown; summary?: unknown }
    if (
      typeof body.unitId !== 'string' ||
      body.unitId.trim() === '' ||
      typeof body.videoId !== 'string' ||
      body.videoId.trim() === '' ||
      typeof body.order !== 'number' ||
      !Number.isFinite(body.order) ||
      typeof body.summary !== 'string' ||
      body.summary.trim() === ''
    ) {
      res.status(400).json({ error: 'unitId, videoId, order, and summary are required' })
      return
    }
    const { lessonId, video } = await createLesson({
      unitId: body.unitId,
      videoId: body.videoId,
      order: body.order,
      summary: body.summary,
    })

    let practiceGenerated = true
    try {
      await generatePracticeSession(lessonId, {
        lessonTitle: video.title,
        lessonSummary: body.summary,
        videoTitle: video.title,
        videoDescription: video.description,
      })
    } catch (err) {
      practiceGenerated = false
      console.error(`Practice generation failed for lesson ${lessonId}`, err)
    }

    res.status(201).json({ lessonId, practiceGenerated })
  }),
)

adminRouter.post(
  '/admin/lessons/:lessonId/video',
  authAttemptLimiter,
  verifyFirebaseToken,
  requireAdmin,
  adminMutationLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as { videoId?: unknown; summary?: unknown }
    if (typeof body.videoId !== 'string' || body.videoId.trim() === '') {
      res.status(400).json({ error: 'videoId is required' })
      return
    }
    const summary = typeof body.summary === 'string' ? body.summary : undefined

    const { lessonId } = req.params
    const { video, summary: resolvedSummary, keyRule } = await assignVideoToExistingLesson({
      lessonId,
      videoId: body.videoId,
      summary,
    })

    let practiceGenerated = true
    try {
      await generatePracticeSession(lessonId, {
        lessonTitle: video.title,
        lessonSummary: resolvedSummary,
        videoTitle: video.title,
        videoDescription: video.description,
        keyRule,
      })
    } catch (err) {
      practiceGenerated = false
      console.error(`Practice generation failed for lesson ${lessonId}`, err)
    }

    res.json({ practiceGenerated })
  }),
)
