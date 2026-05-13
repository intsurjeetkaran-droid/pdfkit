import { Router, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { SERVICE_URLS } from '../config/serviceUrls';
import { authLimiter, uploadLimiter, heavyLimiter } from '../middleware/rateLimiter';
import logger from '../logger';

const router = Router();

// ── Proxy factory ─────────────────────────────────────────────────────────────
// Builds a proxy with:
//   • changeOrigin so the Host header matches the target
//   • timing log on every proxied request (shows gateway → service latency)
//   • 503 fallback when the downstream service is unreachable
//
// NOTE: http-proxy-middleware v2 uses onProxyReq / onProxyRes / onError
//       directly in the options object (not nested under 'on').
const proxyOptions = (target: string, serviceName: string): Options => ({
  target,
  changeOrigin: true,

  // Log every proxied request — records start time for latency calculation
  onProxyReq: (_proxyReq: any, req: any) => {
    req._proxyStart = Date.now();
    logger.info('→ Proxying request', {
      method: req.method,
      path: req.url,
      target: serviceName
    });
  },

  // Log response with latency so you can see gateway overhead vs service time
  onProxyRes: (proxyRes: any, req: any) => {
    const ms = (req as any)._proxyStart ? Date.now() - (req as any)._proxyStart : -1;
    logger.info('← Proxy response', {
      method: req.method,
      path: req.url,
      target: serviceName,
      status: proxyRes.statusCode,
      latencyMs: ms
    });
  },

  // Return 503 when the downstream service is unreachable
  onError: (_err: Error, _req: any, res: any) => {
    logger.error('Proxy error — service unreachable', { target: serviceName });
    if (res && typeof res.status === 'function') {
      res.status(503).json({
        success: false,
        message: `${serviceName} is currently unavailable. Please try again.`
      });
    }
  }
});

// ── Gateway health check ──────────────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
    services: SERVICE_URLS
  });
});

// ── PDF Service  (/api/pdf/*) ─────────────────────────────────────────────────
// Operations: merge, split, rotate, extract, delete-pages, reorder, watermark
// All public — no auth required
router.use(
  '/api/pdf',
  uploadLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.pdf, 'pdf-service'))
);

// ── Conversion Service  (/api/convert/*) ─────────────────────────────────────
// Heavy ops (compress, pdf-to-word) get a tighter per-hour limit because they
// spawn LibreOffice / Ghostscript processes which are CPU-intensive.
router.use(
  '/api/convert/compress',
  heavyLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.conversion, 'conversion-service'))
);
router.use(
  '/api/convert/pdf-to-word',
  heavyLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.conversion, 'conversion-service'))
);
router.use(
  '/api/convert',
  uploadLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.conversion, 'conversion-service'))
);

// ── Storage Service  (/api/storage/*) ────────────────────────────────────────
// Guest upload-temp, download, delete — no auth required
router.use(
  '/api/storage',
  createProxyMiddleware(proxyOptions(SERVICE_URLS.storage, 'storage-service'))
);

// ── Queue Service  (/api/queue/*) ─────────────────────────────────────────────
// Job status polling + Bull Board dashboard
router.use(
  '/api/queue',
  createProxyMiddleware(proxyOptions(SERVICE_URLS.queue, 'queue-service'))
);

// ── Organization Service  (/api/organize/*) ───────────────────────────────────
// Reorder, duplicate, remove pages
router.use(
  '/api/organize',
  uploadLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.organization, 'organization-service'))
);

// ── Security Service  (/api/security/*) ──────────────────────────────────────
// Protect, unlock, remove metadata
router.use(
  '/api/security',
  uploadLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.security, 'security-service'))
);

// ── Metadata Service  (/api/meta/*) ──────────────────────────────────────────
// Info, page-count, preview generation
router.use(
  '/api/meta',
  uploadLimiter,
  createProxyMiddleware(proxyOptions(SERVICE_URLS.metadata, 'metadata-service'))
);

export default router;
