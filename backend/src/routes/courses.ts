import { Router } from 'express'
import { getCourseDetail, listCourses } from '../services/content.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const coursesRouter = Router()

coursesRouter.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const courses = await listCourses()
    res.json({ courses })
  }),
)

coursesRouter.get(
  '/courses/:courseId',
  asyncHandler(async (req, res) => {
    const course = await getCourseDetail(req.params.courseId)
    if (!course) {
      res.status(404).json({ error: 'Course not found' })
      return
    }
    res.json({ course })
  }),
)
