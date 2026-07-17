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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.join(__dirname, '../../frontend/dist')
const port = Number(process.env.PORT) || 8080
const CANONICAL_HOST = 'verablock.org'

const app = express()

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
