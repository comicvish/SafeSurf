import type { NextFunction, Request, Response } from 'express'

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase())
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  const email = res.locals.email as string | null | undefined
  if (!isAdminEmail(email)) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
