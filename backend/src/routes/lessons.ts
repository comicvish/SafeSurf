import { Router } from 'express'
import { getLessonDetail } from '../services/content.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { publicReadLimiter } from '../middleware/rateLimits.js'

export const lessonsRouter = Router()

lessonsRouter.get(
  '/lessons/:lessonId',
  publicReadLimiter,
  asyncHandler(async (req, res) => {
    const lesson = await getLessonDetail(req.params.lessonId)
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' })
      return
    }
    res.json({ lesson })
  }),
)
