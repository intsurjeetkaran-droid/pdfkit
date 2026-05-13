import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './logger';
import { generalLimiter } from './middleware/rateLimiter';
import { attachRequestId } from './middleware/requestId';
import routes from './routes/index';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Dev: allow all origins.
// Prod: use ALLOWED_ORIGINS env var (comma-separated, or "*" for all).
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV !== 'production') return '*';
  const env = process.env.ALLOWED_ORIGINS || '';
  if (!env || env === '*') return '*';
  return env.split(',').map((o) => o.trim());
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

// ── HTTP request logging ──────────────────────────────────────────────────────
// Morgan writes one line per request; Winston handles structured service logs.
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) }
  })
);

// ── Distributed tracing ───────────────────────────────────────────────────────
// Attach a unique x-request-id to every request so logs can be correlated
// across all downstream microservices.
app.use(attachRequestId);

// ── Global rate limiting ──────────────────────────────────────────────────────
// Applied before any proxy — blocks abusive clients at the gateway level.
app.use(generalLimiter);

// ── Proxy routes ──────────────────────────────────────────────────────────────
// NOTE: express.json() is intentionally NOT applied globally here.
// Parsing the body stream here would consume it before http-proxy-middleware
// can forward the raw multipart/form-data to downstream services.
app.use('/', routes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
