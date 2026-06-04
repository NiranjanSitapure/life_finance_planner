import { Router, type Request, type Response } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'

export const authRouter = Router()

// Configure Passport Google strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value ?? ''
      const user = await prisma.user.upsert({
        where: { googleId: profile.id },
        create: {
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value,
        },
        update: {
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value,
        },
      })
      done(null, user)
    } catch (err) {
      done(err as Error)
    }
  },
))

// Initiate Google OAuth flow
authRouter.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
)

// Handle Google callback
authRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}?auth=error` }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
    res.redirect(process.env.FRONTEND_URL!)
  },
)

// Get current user
authRouter.get('/me', (req: Request, res: Response): void => {
  const token = req.cookies?.token as string | undefined
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    }).then(user => {
      if (!user) { res.status(401).json({ error: 'User not found' }); return }
      res.json(user)
    }).catch(() => res.status(500).json({ error: 'Server error' }))
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' })
  res.json({ ok: true })
})
