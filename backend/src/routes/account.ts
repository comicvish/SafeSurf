import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { deleteAccount } from '../services/account.js'

export const accountRouter = Router()

accountRouter.delete(
  '/account',
  verifyFirebaseToken,
  asyncHandler(async (_req, res) => {
    await deleteAccount(res.locals.uid)
    res.status(204).end()
  }),
)
