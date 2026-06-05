import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'
import { authRouter } from './routes/auth'
import { configRouter } from './routes/config'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

// FRONTEND_URL can be a single origin or a comma-separated list (e.g. for preview deployments)
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.set('trust proxy', 1) // required behind Railway/Render/Vercel proxies for secure cookies

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin/no-origin (curl, health checks) and any whitelisted origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(passport.initialize())

app.use('/api/auth', authRouter)
app.use('/api/config', configRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})

export default app
