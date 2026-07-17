import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { getProgress, setLessonComplete } from '../services/progress.js'

export const progressRouter = Router()

progressRouter.get(
  '/progress',
  verifyFirebaseToken,
  asyncHandler(async (_req, res) => {
    const completedLessonIds = await getProgress(res.locals.uid)
    res.json({ completedLessonIds })
  }),
)

progressRouter.put(
  '/progress/:lessonId',
  verifyFirebaseToken,
  asyncHandler(async (req, res) => {
    const completed = (req.body as { completed?: unknown } | undefined)?.completed
    if (typeof completed !== 'boolean') {
      res.status(400).json({ error: 'completed must be a boolean' })
      return
    }
    await setLessonComplete(res.locals.uid, req.params.lessonId, completed)
    res.json({ ok: true })
  }),
)
