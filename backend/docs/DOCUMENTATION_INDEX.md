# Documentation Index

**PDFKit v3.0 — Guest-First PDF Platform**  
**Status:** ✅ 11 Services Running  
**Last Updated:** May 16, 2026

---

## Quick Start

→ [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## For Frontend Developers

| File | Contents |
|------|---------|
| [**API-REFERENCE.md**](./API-REFERENCE.md) | Every endpoint — full request/response/errors |
| [**FRONTEND-INTEGRATION.md**](./FRONTEND-INTEGRATION.md) | FormData, fetch, blob downloads, React/Vue/TS examples |
| [**WORKFLOWS.md**](./WORKFLOWS.md) | Merge, watermark, compress, HTML→PDF, poll jobs |
| [**ERROR-HANDLING.md**](./ERROR-HANDLING.md) | All error codes, retry logic, user-friendly messages |

---

## Core Docs

| File | Contents |
|------|---------|
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Architecture, design decisions, tech stack, timing logs |
| [03-API-STANDARDS.md](./03-API-STANDARDS.md) | Request/response format, rate limits, file limits |
| [04-API-GATEWAY.md](./04-API-GATEWAY.md) | Proxy routes, timing logs, 503 handling |

---

## Service Docs

| File | Service | Port | Status |
|------|---------|------|--------|
| [06-PDF-SERVICE.md](./06-PDF-SERVICE.md) | merge/split/rotate/extract/delete/reorder/watermark | 3001 | ✅ |
| [07-CONVERSION-SERVICE.md](./07-CONVERSION-SERVICE.md) | 10 conversion operations | 3002 | ✅ |
| [08-STORAGE-SERVICE.md](./08-STORAGE-SERVICE.md) | guest upload, TTL cleanup, streaming download | 3003 | ✅ |
| [09-QUEUE-SERVICE.md](./09-QUEUE-SERVICE.md) | BullMQ 8 queues, Bull Board, job management | 3006 | ✅ |
| [09-ORGANIZATION-SERVICE.md](./09-ORGANIZATION-SERVICE.md) | reorder/duplicate/remove pages | 3007 | ✅ |
| [10-SECURITY-SERVICE.md](./10-SECURITY-SERVICE.md) | protect/unlock/remove-metadata | 3008 | ✅ |
| [11-METADATA-SERVICE.md](./11-METADATA-SERVICE.md) | info/page-count/preview thumbnail | 3009 | ✅ |
| [12-HTML-SERVICE.md](./12-HTML-SERVICE.md) | html→pdf, url→pdf, string→pdf (Chromium) | 3010 | ✅ NEW |

---

## Service Ports

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| API Gateway | 3000 | ✅ | Entry point for all requests |
| PDF Service | 3001 | ✅ | 7 operations |
| Conversion Service | 3002 | ✅ | 10 operations |
| Storage Service | 3003 | ✅ | MySQL-backed, 1hr TTL |
| Queue Service | 3006 | ✅ | 8 queues, Bull Board at /admin/queues |
| Organization Service | 3007 | ✅ | 3 operations |
| Security Service | 3008 | ✅ | qpdf + pdf-lib |
| Metadata Service | 3009 | ✅ | pdf-lib + pdftoppm |
| HTML Service | 3010 | ✅ | Chromium, 3 operations |
| MySQL | 3307 | ✅ | File + Job tables |
| Redis | 6380 | ✅ | BullMQ + rate limiting |

---

## All Routes at a Glance

```
PDF Service (:3001)
  POST /api/pdf/merge
  POST /api/pdf/split
  POST /api/pdf/rotate
  POST /api/pdf/extract
  POST /api/pdf/delete-pages
  POST /api/pdf/reorder
  POST /api/pdf/watermark

Conversion Service (:3002)
  POST /api/convert/word-to-pdf
  POST /api/convert/excel-to-pdf
  POST /api/convert/ppt-to-pdf
  POST /api/convert/pdf-to-image
  POST /api/convert/image-to-pdf
  POST /api/convert/compress
  POST /api/convert/pdf-to-word
  POST /api/convert/pdf-to-text    ← v3.0
  POST /api/convert/svg-to-pdf     ← v3.0
  POST /api/convert/images-to-pdf  ← v3.0

HTML Service (:3010) ← v3.0
  POST /api/html/string-to-pdf
  POST /api/html/file-to-pdf
  POST /api/html/url-to-pdf

Storage Service (:3003)
  POST   /api/storage/upload-temp
  GET    /api/storage/temp/:id
  GET    /api/storage/temp/:id/download
  DELETE /api/storage/temp/:id
  GET    /api/storage/stats
  POST   /api/storage/cleanup

Organization Service (:3007)
  POST /api/organize/reorder
  POST /api/organize/duplicate
  POST /api/organize/remove

Security Service (:3008)
  POST /api/security/protect
  POST /api/security/unlock
  POST /api/security/remove-metadata

Metadata Service (:3009)
  POST /api/meta/info
  POST /api/meta/page-count
  POST /api/meta/preview

Queue Service (:3006)
  POST /api/queue/jobs
  GET  /api/queue/jobs/:queue/:id
  GET  /api/queue/stats
  POST /api/queue/jobs/:queue/:id/retry
  GET  /admin/queues

Health (all services)
  GET /health
```

---

## Test Commands

```bash
node tests/run.js              # all 342 tests
node tests/run.js --only 01    # infrastructure & health
node tests/run.js --only 02    # storage
node tests/run.js --only 03    # pdf
node tests/run.js --only 04    # conversion
node tests/run.js --only 05    # organization
node tests/run.js --only 06    # queue
node tests/run.js --only 07    # edge cases
node tests/run.js --only 08    # security
node tests/run.js --only 09    # metadata
node tests/run.js --skip 01    # skip infra (faster)
```
