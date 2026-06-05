// env must be imported first — validates all required vars and exits with a clear
// message if any are missing, before any other module touches process.env.
import './env'
import { env } from './env'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'
import { authRouter } from './routes/auth'
import { configRouter } from './routes/config'

const app = express()

// FRONTEND_URL can be a single origin or a comma-separated list (e.g. preview deployments)
const allowedOrigins = env.FRONTEND_URL
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.set('trust proxy', 1) // required behind Railway/Render/Vercel proxies for secure cookies

app.use(cors({
  origin: (origin, cb) => {
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

// Health check — intentionally DB-free so it passes even when Postgres is slow
app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${env.PORT}`)
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})

export default app
