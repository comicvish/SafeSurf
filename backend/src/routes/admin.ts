import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { requireAdmin, isAdminEmail } from '../middleware/requireAdmin.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { syncYoutubeVideos } from '../services/youtube.js'
import { listUnassignedVideos, markVideoAssigned } from '../services/videos.js'
import { createLesson } from '../services/content.js'

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
  verifyFirebaseToken,
  requireAdmin,
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
    const body = req.body as { unitId?: string; videoId?: string; title?: string; order?: number; summary?: string }
    if (!body.unitId || !body.videoId || !body.title || typeof body.order !== 'number' || !body.summary) {
      res.status(400).json({ error: 'unitId, videoId, title, order, and summary are required' })
      return
    }
    const lessonId = await createLesson({
      unitId: body.unitId,
      videoId: body.videoId,
      title: body.title,
      order: body.order,
      summary: body.summary,
    })
    await markVideoAssigned(body.videoId)
    res.status(201).json({ lessonId })
  }),
)
