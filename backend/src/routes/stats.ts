import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { getUserStats } from '../services/stats.js'

export const statsRouter = Router()

statsRouter.get(
  '/stats',
  verifyFirebaseToken,
  asyncHandler(async (_req, res) => {
    const stats = await getUserStats(res.locals.uid)
    res.json({ stats })
  }),
)
