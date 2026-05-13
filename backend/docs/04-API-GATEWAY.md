# API Gateway

**Port:** 3000  
**Version:** 2.0.0

---

## Overview

Pure reverse proxy. No auth enforcement. Every request is forwarded to the correct downstream service with:
- Rate limiting
- Request ID attachment (distributed tracing)
- Proxy latency logging

---

## Routes

| Path | Target | Rate Limit |
|------|--------|-----------|
| `GET /health` | Gateway itself | — |
| `/api/pdf/**` | pdf-service:3001 | 100/15min |
| `/api/convert/compress` | conversion-service:3002 | **20/hour** |
| `/api/convert/pdf-to-word` | conversion-service:3002 | **20/hour** |
| `/api/convert/**` | conversion-service:3002 | 100/15min |
| `/api/storage/**` | storage-service:3003 | — |
| `/api/queue/**` | queue-service:3006 | — |
| `/api/organize/**` | organization-service:3007 | 100/15min |
| `/api/security/**` | security-service:3008 | 100/15min |
| `/api/meta/**` | metadata-service:3009 | 100/15min |

---

## Proxy Logging

Every proxied request logs:

```
→ Proxying request  { method: "POST", path: "/api/pdf/merge", target: "pdf-service" }
← Proxy response    { method: "POST", path: "/api/pdf/merge", target: "pdf-service", status: 200, latencyMs: 312 }
```

This lets you see gateway overhead separately from service processing time.

---

## Health Check

```
GET /health

{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2026-05-13T10:00:00.000Z",
  "uptime": "3600s",
  "services": {
    "pdf": "http://pdf-service:3001",
    "conversion": "http://conversion-service:3002",
    ...
  }
}
```

---

## Service Unavailable

When a downstream service is unreachable:

```json
{
  "success": false,
  "message": "pdf-service is currently unavailable. Please try again."
}
```

HTTP status: `503`

---

## Important: No Body Parsing

`express.json()` is intentionally NOT applied at the gateway level. Parsing the body stream here would consume it before `http-proxy-middleware` can forward the raw `multipart/form-data` to downstream services. Body parsing is handled by each individual microservice.
