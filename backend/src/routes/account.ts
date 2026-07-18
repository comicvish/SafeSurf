import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authAttemptLimiter, sensitiveActionLimiter } from '../middleware/rateLimits.js'
import { deleteAccount } from '../services/account.js'

export const accountRouter = Router()

accountRouter.delete(
  '/account',
  authAttemptLimiter,
  verifyFirebaseToken,
  sensitiveActionLimiter,
  asyncHandler(async (_req, res) => {
    await deleteAccount(res.locals.uid)
    res.status(204).end()
  }),
)
