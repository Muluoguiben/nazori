import { Hono } from 'hono';
import type { AppEnv } from './types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { translateHandler } from './routes/translate';

const app = new Hono<AppEnv>();

// Global CORS middleware
app.use('*', corsMiddleware);

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// Translation endpoint with auth + rate limiting
app.post('/api/v1/translate', authMiddleware, rateLimitMiddleware, translateHandler);

export default app;
