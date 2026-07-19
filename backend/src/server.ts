import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import compression from 'compression'
import { healthRouter } from './routes/health.js'
import { coursesRouter } from './routes/courses.js'
import { lessonsRouter } from './routes/lessons.js'
import { progressRouter } from './routes/progress.js'
import { adminRouter } from './routes/admin.js'
import { practiceRouter } from './routes/practice.js'
import { statsRouter } from './routes/stats.js'
import { inquiriesRouter } from './routes/inquiries.js'
import { accountRouter } from './routes/account.js'
import { listCourseDetails } from './services/content.js'
import { asyncHandler } from './middleware/asyncHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.join(__dirname, '../../frontend/dist')
const port = Number(process.env.PORT) || 8080
const CANONICAL_HOST = 'verablock.org'
const SITE_ORIGIN = `https://${CANONICAL_HOST}`

const sitemapStaticPaths = ['/', '/courses', '/in-person-courses', '/privacy', '/terms', '/accessibility']

function sitemapUrl(pathname: string): string {
  return `${SITE_ORIGIN}${pathname}`
}

const app = express()

// Cloud Run sits behind a load balancer — without this, req.ip is always the
// LB's internal address, breaking IP-based rate limiting.
app.set('trust proxy', true)

// Express sends this by default, fingerprinting the backend framework to
// anyone probing the site for free.
app.disable('x-powered-by')

// Baseline security headers with no behavioral tradeoff. Deliberately no
// Content-Security-Policy here — this app relies on Google Sign-In popups,
// Firebase Auth's own popup/redirect flow, and YouTube iframe embeds, and a
// CSP tight enough to matter needs to be tuned against all three rather than
// bolted on as a one-liner.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  next()
})

app.use((req, res, next) => {
  if (req.hostname === `www.${CANONICAL_HOST}`) {
    res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`)
    return
  }
  next()
})

app.use(compression())
app.use(express.json())

app.use('/api', healthRouter)
app.use('/api', coursesRouter)
app.use('/api', lessonsRouter)
app.use('/api', progressRouter)
app.use('/api', adminRouter)
app.use('/api', practiceRouter)
app.use('/api', statsRouter)
app.use('/api', inquiriesRouter)
app.use('/api', accountRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Keep the sitemap tied to the live curriculum: newly created courses and
// lessons appear the next time Google requests this URL, with no manual XML
// maintenance required. Private account/admin/practice routes stay excluded.
app.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const courses = await listCourseDetails()
    const urls = [
      ...sitemapStaticPaths.map(sitemapUrl),
      ...courses.flatMap((course) => [
        sitemapUrl(`/courses/${encodeURIComponent(course.id)}`),
        ...course.units.flatMap((unit) =>
          unit.lessons.map((lesson) => sitemapUrl(`/lessons/${encodeURIComponent(lesson.id)}`)),
        ),
      ]),
    ]

    const entries = urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')
    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=300')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`)
  }),
)

app.use(express.static(frontendDist))

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`VeraBlock backend listening on port ${port}`)
})
