import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authAttemptLimiter, authenticatedLimiter, publicReadLimiter } from '../middleware/rateLimits.js'
import {
  getPracticeSession,
  getQuestionAnswer,
  InvalidPracticeAnswersError,
  PracticeSessionNotFoundError,
  submitPracticeAnswers,
} from '../services/practice.js'

export const practiceRouter = Router()

practiceRouter.get(
  '/lessons/:lessonId/practice',
  publicReadLimiter,
  asyncHandler(async (req, res) => {
    const practice = await getPracticeSession(req.params.lessonId)
    if (!practice) {
      res.status(404).json({ error: 'No practice session for this lesson' })
      return
    }
    res.json({ practice })
  }),
)

// Requires sign-in so the answer key can't be scraped anonymously — mirrors
// the frontend's ProtectedRoute gate on the practice page itself.
practiceRouter.get(
  '/lessons/:lessonId/practice/questions/:questionId/answer',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (req, res) => {
    const answer = await getQuestionAnswer(req.params.lessonId, req.params.questionId)
    if (!answer) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    res.json({ answer })
  }),
)

practiceRouter.post(
  '/lessons/:lessonId/practice/submit',
  authAttemptLimiter,
  verifyFirebaseToken,
  authenticatedLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as { answers?: unknown }
    if (!Array.isArray(body.answers) || !body.answers.every((a) => typeof a === 'number')) {
      res.status(400).json({ error: 'answers must be an array of numbers' })
      return
    }
    try {
      const result = await submitPracticeAnswers(res.locals.uid, req.params.lessonId, body.answers)
      res.json(result)
    } catch (err) {
      if (err instanceof PracticeSessionNotFoundError) {
        res.status(404).json({ error: 'No practice session for this lesson' })
        return
      }
      if (err instanceof InvalidPracticeAnswersError) {
        res.status(400).json({ error: err.message })
        return
      }
      throw err
    }
  }),
)
