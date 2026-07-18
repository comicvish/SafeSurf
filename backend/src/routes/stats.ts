import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authAttemptLimiter, authenticatedLimiter } from '../middleware/rateLimits.js'
import { getUserStats } from '../services/stats.js'

export const statsRouter = Router()

statsRouter.get(
  '/stats',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (_req, res) => {
    const stats = await getUserStats(res.locals.uid)
    res.json({ stats })
  }),
)
