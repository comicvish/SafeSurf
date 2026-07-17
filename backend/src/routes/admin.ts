import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { requireAdmin, isAdminEmail } from '../middleware/requireAdmin.js'
import { verifySchedulerOrAdmin } from '../middleware/verifySchedulerOrAdmin.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { syncYoutubeVideos } from '../services/youtube.js'
import { listUnassignedVideos } from '../services/videos.js'
import { createLesson } from '../services/content.js'
import { generatePracticeSession } from '../services/practice.js'

export const adminRouter = Router()

adminRouter.get(
  '/admin/me',
  verifyFirebaseToken,
  asyncHandler(async (_req, res) => {
    res.json({ isAdmin: isAdminEmail(res.locals.email) })
  }),
)

adminRouter.post(
  '/admin/sync-youtube',
  verifySchedulerOrAdmin,
  asyncHandler(async (_req, res) => {
    const result = await syncYoutubeVideos()
    res.json({ result })
  }),
)

adminRouter.get(
  '/admin/videos',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const videos = await listUnassignedVideos()
    res.json({ videos })
  }),
)

adminRouter.post(
  '/admin/lessons',
  verifyFirebaseToken,
  requireAdmin,
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
