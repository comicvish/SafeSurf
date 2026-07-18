import { Router } from 'express'
import { getCourseDetail, listCourseDetails, listCourses } from '../services/content.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { publicReadLimiter } from '../middleware/rateLimits.js'

export const coursesRouter = Router()

coursesRouter.get(
  '/courses',
  publicReadLimiter,
  asyncHandler(async (_req, res) => {
    const courses = await listCourses()
    res.json({ courses })
  }),
)

// Full nested detail for every course in one call — used by the dashboard,
// which needs every course's unit/lesson list at once and would otherwise
// have to call GET /courses/:courseId once per course (N+1).
coursesRouter.get(
  '/courses/details',
  publicReadLimiter,
  asyncHandler(async (_req, res) => {
    const courses = await listCourseDetails()
    res.json({ courses })
  }),
)

coursesRouter.get(
  '/courses/:courseId',
  publicReadLimiter,
  asyncHandler(async (req, res) => {
    const course = await getCourseDetail(req.params.courseId)
    if (!course) {
      res.status(404).json({ error: 'Course not found' })
      return
    }
    res.json({ course })
  }),
)
