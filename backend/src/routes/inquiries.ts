import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { sendInquiryEmail } from '../services/email.js'

export const inquiriesRouter = Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

inquiriesRouter.post(
  '/inquiries',
  asyncHandler(async (req, res) => {
    const body = req.body as { name?: unknown; email?: unknown; preferredDate?: unknown; message?: unknown }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const preferredDate = typeof body.preferredDate === 'string' ? body.preferredDate.trim() : ''

    if (!name || !email || !message) {
      res.status(400).json({ error: 'name, email, and message are required' })
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'email is not valid' })
      return
    }

    try {
      await sendInquiryEmail({ name, email, message, preferredDate: preferredDate || undefined })
    } catch (err) {
      console.error('Failed to send inquiry email', err)
      res.status(502).json({ error: 'Could not send your message right now. Please try again shortly.' })
      return
    }

    res.status(200).json({ sent: true })
  }),
)
