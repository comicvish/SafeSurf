import type { NextFunction, Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { auth } from '../services/firebaseAdmin.js'
import { isAdminEmail } from './requireAdmin.js'

const oidcClient = new OAuth2Client()

/**
 * Accepts either a Firebase ID token from an allowlisted admin (manual
 * trigger from the curation UI) or a Google-signed OIDC token from the
 * Cloud Scheduler service account (automated daily sync).
 */
export async function verifySchedulerOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }
  const token = header.slice('Bearer '.length)

  try {
    const decoded = await auth.verifyIdToken(token)
    if (isAdminEmail(decoded.email)) {
      next()
      return
    }
    res.status(403).json({ error: 'Admin access required' })
    return
  } catch {
    // Not a valid Firebase token — fall through and try Scheduler OIDC.
  }

  const expectedAudience = process.env.SCHEDULER_OIDC_AUDIENCE
  const expectedEmail = process.env.SCHEDULER_SERVICE_ACCOUNT_EMAIL
  if (!expectedAudience || !expectedEmail) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  try {
    const ticket = await oidcClient.verifyIdToken({ idToken: token, audience: expectedAudience })
    const payload = ticket.getPayload()
    if (payload?.email === expectedEmail && payload.email_verified) {
      next()
      return
    }
    res.status(401).json({ error: 'Invalid or expired token' })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
