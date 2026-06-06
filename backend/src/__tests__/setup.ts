// Runs before any test file — sets env vars before any module (env.ts) loads.
process.env.DATABASE_URL         = 'postgresql://u:p@localhost:5432/test'
process.env.JWT_SECRET           = 'test-secret-at-least-16-chars-long'
process.env.FRONTEND_URL         = 'http://localhost:5173'
process.env.GOOGLE_CLIENT_ID     = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.NODE_ENV             = 'test'
process.env.PORT                 = '0'
