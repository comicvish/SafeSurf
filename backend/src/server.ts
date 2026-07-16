import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import compression from 'compression'
import { healthRouter } from './routes/health.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.join(__dirname, '../../frontend/dist')
const port = Number(process.env.PORT) || 8080

const app = express()
app.use(compression())

app.use('/api', healthRouter)

app.use(express.static(frontendDist))

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.listen(port, () => {
  console.log(`SafeSurf backend listening on port ${port}`)
})
