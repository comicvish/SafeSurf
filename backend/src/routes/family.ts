import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authAttemptLimiter, authenticatedLimiter, sensitiveActionLimiter } from '../middleware/rateLimits.js'
import { acceptInvite, confirmSafeWord, createInvite, FamilyLinkError, getStatus, unlink } from '../services/family.js'

export const familyRouter = Router()

familyRouter.get(
  '/family/status',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (_req, res) => {
    const status = await getStatus(res.locals.uid)
    res.json({ status })
  }),
)

familyRouter.post(
  '/family/invite',
  authAttemptLimiter,
  verifyFirebaseToken,
  sensitiveActionLimiter,
  asyncHandler(async (_req, res) => {
    try {
      const invite = await createInvite(res.locals.uid, res.locals.email ?? '')
      res.status(201).json(invite)
    } catch (err) {
      if (err instanceof FamilyLinkError) {
        res.status(400).json({ error: err.message })
        return
      }
      throw err
    }
  }),
)

familyRouter.post(
  '/family/accept/:linkId',
  authAttemptLimiter,
  verifyFirebaseToken,
  sensitiveActionLimiter,
  asyncHandler(async (req, res) => {
    try {
      await acceptInvite(req.params.linkId, res.locals.uid, res.locals.email ?? '')
      res.status(204).end()
    } catch (err) {
      if (err instanceof FamilyLinkError) {
        res.status(400).json({ error: err.message })
        return
      }
      throw err
    }
  }),
)

familyRouter.post(
  '/family/confirm-safeword',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (_req, res) => {
    try {
      await confirmSafeWord(res.locals.uid)
      res.status(204).end()
    } catch (err) {
      if (err instanceof FamilyLinkError) {
        res.status(400).json({ error: err.message })
        return
      }
      throw err
    }
  }),
)

familyRouter.delete(
  '/family/link',
  authAttemptLimiter,
  verifyFirebaseToken,
  sensitiveActionLimiter,
  asyncHandler(async (_req, res) => {
    await unlink(res.locals.uid)
    res.status(204).end()
  }),
)
