import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit'
import type { Request, Response } from 'express'

// Keys by the verified Firebase uid when available (so one account can't be
// starved by another user sharing its IP, e.g. behind a school/library NAT)
// and falls back to IP for routes that run before/without token
// verification. Must be mounted *after* verifyFirebaseToken on any route
// that wants uid-based keying — res.locals.uid isn't set until then.
//
// The IP fallback goes through ipKeyGenerator() rather than raw req.ip —
// without it, IPv6 clients could dodge the limit by cycling through
// addresses in the same /64 subnet, which are usually all assigned to the
// same client.
function keyGenerator(req: Request, res: Response): string {
  const uid = res.locals.uid as string | undefined
  if (uid) return uid
  return ipKeyGenerator(req.ip ?? 'unknown')
}

const shared: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Too many requests. Please try again later.' },
}

// Mount FIRST, before verifyFirebaseToken/requireAdmin/verifySchedulerOrAdmin
// on every authenticated route. Every other limiter here is keyed by uid and
// only runs *after* the auth middleware — but Express never reaches a later
// middleware once an earlier one rejects the request, so a limiter placed
// only after the auth check never sees repeated invalid/expired/forged
// tokens at all. This one is IP-keyed (no uid exists yet at this point in
// the chain) and catches that traffic regardless of whether the token turns
// out to be valid — the actual equivalent of "lock out repeated failed
// authentication attempts" for a backend that never sees a password itself.
export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
  message: { error: 'Too many requests. Please try again later.' },
})

// Public, unauthenticated reads — course catalog, lesson pages, practice
// session fetch. Generous: this covers normal browsing, including a page
// re-rendering/re-fetching on navigation.
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  ...shared,
})

// Authenticated reads/writes gated behind verifyFirebaseToken — progress,
// stats, practice submission, answer reveal, admin status checks.
export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  ...shared,
})

// Admin content-mutation actions (creating a lesson, listing unassigned
// videos for curation). Admin-only already, but still capped against a
// compromised admin token or a runaway script.
export const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  ...shared,
})

// Irreversible account actions. A real user does this at most once ever —
// tight on purpose.
export const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...shared,
})

// YouTube sync: calls an external, quota-limited API and is normally only
// triggered once a day by Cloud Scheduler (whose OIDC-verified requests
// don't carry a uid, hence IP-only keying here) plus occasional manual
// admin retries.
export const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})
