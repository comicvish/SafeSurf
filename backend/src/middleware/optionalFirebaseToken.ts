import type { NextFunction, Request, Response } from 'express'
import { auth } from '../services/firebaseAdmin.js'

// Like verifyFirebaseToken, but never rejects the request — a missing or
// invalid token just leaves res.locals.uid unset. Used by routes that behave
// slightly differently for a signed-in caller (e.g. interleaving a review
// question) but must still work for anonymous ones.
export async function optionalFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }
  try {
    const decoded = await auth.verifyIdToken(header.slice('Bearer '.length))
    res.locals.uid = decoded.uid
    res.locals.email = decoded.email ?? null
  } catch {
    // Invalid/expired token on an optional-auth route — proceed anonymously
    // rather than failing the request.
  }
  next()
}
