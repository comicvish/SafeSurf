import { Router } from 'express'
import { db } from '../services/firestore.js'

export const healthRouter = Router()

healthRouter.get('/health', async (_req, res) => {
  try {
    await db.collection('courses').limit(1).get()
    res.json({ ok: true, firestore: 'reachable' })
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
})
