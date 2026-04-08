import { Hono } from 'hono';
import type { AppEnv } from './types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { translateHandler, translateFullHandler } from './routes/translate';

const app = new Hono<AppEnv>();

// Global CORS middleware
app.use('*', corsMiddleware);

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// Translation endpoint — SSE streaming (primary, used by extension)
app.post('/api/v1/translate', authMiddleware, rateLimitMiddleware, translateHandler);

// Translation endpoint — full response via LangGraph (batch/API consumers)
app.post('/api/v1/translate/full', authMiddleware, rateLimitMiddleware, translateFullHandler);

export default app;
