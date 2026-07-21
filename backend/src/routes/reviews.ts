import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authAttemptLimiter, authenticatedLimiter } from '../middleware/rateLimits.js'
import { resolveDueReviews } from '../services/reviews.js'

export const reviewsRouter = Router()

reviewsRouter.get(
  '/reviews/due',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (req, res) => {
    const reviews = await resolveDueReviews(res.locals.uid)
    res.json({ reviews })
  }),
)
