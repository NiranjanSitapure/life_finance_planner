"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../db/client");
exports.authRouter = (0, express_1.Router)();
// Configure Passport Google strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value ?? '';
        const user = await client_1.prisma.user.upsert({
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
        });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
// Initiate Google OAuth flow
exports.authRouter.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
// Handle Google callback
exports.authRouter.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}?auth=error` }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        // 'none' is required for cross-site cookies (Vercel frontend ↔ Railway backend)
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    // Redirect to the first allowed origin (the primary frontend URL)
    const primaryFrontend = (process.env.FRONTEND_URL ?? '').split(',')[0].trim();
    res.redirect(primaryFrontend);
});
// Get current user
exports.authRouter.get('/me', (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        client_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true, avatarUrl: true },
        }).then(user => {
            if (!user) {
                res.status(401).json({ error: 'User not found' });
                return;
            }
            res.json(user);
        }).catch(() => res.status(500).json({ error: 'Server error' }));
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Logout
exports.authRouter.post('/logout', (_req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    });
    res.json({ ok: true });
});
