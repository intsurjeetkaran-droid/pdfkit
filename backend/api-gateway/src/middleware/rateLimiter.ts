import rateLimit from 'express-rate-limit';

// ── Test mode ─────────────────────────────────────────────────────────────────
// When TEST_MODE=true, limits are raised to 10,000 so automated test suites
// never hit 429. Set this in docker-compose for local dev/testing only.
const isTestMode = process.env.TEST_MODE === 'true';
const GENERAL_MAX  = isTestMode ? 10000 : 100;
const UPLOAD_MAX   = isTestMode ? 10000 : 100;
const AUTH_MAX     = isTestMode ? 10000 : 50;
const HEAVY_MAX    = isTestMode ? 10000 : 20;
const WINDOW_MS    = isTestMode ? 1000  : 15 * 60 * 1000; // 1s window in test mode
const HEAVY_WIN_MS = isTestMode ? 1000  : 60 * 60 * 1000;

// General rate limiter — applied to all routes
export const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: GENERAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Auth endpoints — stricter limit
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

// Upload/processing limiter — PDF ops, conversions, organize
export const uploadLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: UPLOAD_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please try again later.' }
});

// Heavy operations limiter — compress, pdf-to-word (CPU-intensive)
export const heavyLimiter = rateLimit({
  windowMs: HEAVY_WIN_MS,
  max: HEAVY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Heavy operation limit reached. Please try again in an hour.' }
});
