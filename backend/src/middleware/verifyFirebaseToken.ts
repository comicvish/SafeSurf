import type { NextFunction, Request, Response } from 'express'
import { auth } from '../services/firebaseAdmin.js'

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }
  try {
    const decoded = await auth.verifyIdToken(header.slice('Bearer '.length))
    res.locals.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
