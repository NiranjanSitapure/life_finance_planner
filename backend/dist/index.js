"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("./routes/auth");
const config_1 = require("./routes/config");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
// FRONTEND_URL can be a single origin or a comma-separated list (e.g. for preview deployments)
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
app.set('trust proxy', 1); // required behind Railway/Render/Vercel proxies for secure cookies
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        // allow same-origin/no-origin (curl, health checks) and any whitelisted origin
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use('/api/auth', auth_1.authRouter);
app.use('/api/config', config_1.configRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});
exports.default = app;
