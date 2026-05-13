# PDFKit Backend — Documentation

**Version:** 2.0.0 — Guest-First PDF Platform  
**Status:** ✅ 287/287 Tests Passing  
**Last Updated:** May 13, 2026

---

## What Changed in v2.0

| Change | Details |
|--------|---------|
| ❌ Removed | auth-service, user-service (no auth needed for PDF ops) |
| ❌ Removed | 3 standalone workers (merged into queue-service) |
| ✅ Added | watermark, reorder, pdf-to-word |
| ✅ Added | organization-service (reorder/duplicate/remove pages) |
| ✅ Added | security-service (protect/unlock/remove-metadata) |
| ✅ Added | metadata-service (info/page-count/preview thumbnail) |
| ✅ Increased | Upload limit 20MB → 100MB |
| ✅ Added | 1-hour TTL auto-cleanup for all guest files |
| ✅ Added | Per-step timing logs on every operation |
| ✅ Fixed | Wrong MIME type returns 400 (not 500) |
| ✅ Fixed | Corrupt/empty PDF returns 400 (not 500) |
| ✅ Fixed | downloadUrl points to gateway (not internal Docker hostname) |
| ✅ Fixed | Queue retry of non-failed job returns 400 (not 500) |
| ✅ Fixed | Queue health response standardized to `{status:'ok'}` |
| ✅ Fixed | qpdf errors mapped to clean 400 messages |
| ✅ Fixed | pdfVersion reads from file header (not producer field) |
| ✅ Fixed | fileSizeMB uses 3 decimal places (not 0 for small files) |

---

## Start

```bash
docker-compose up --build -d
node tests/run.js
```

---

## All Routes (no auth required)

```
POST /api/pdf/merge
POST /api/pdf/split
POST /api/pdf/rotate
POST /api/pdf/extract
POST /api/pdf/delete-pages
POST /api/pdf/reorder          ← v2.0
POST /api/pdf/watermark        ← v2.0

POST /api/convert/word-to-pdf
POST /api/convert/excel-to-pdf
POST /api/convert/ppt-to-pdf
POST /api/convert/pdf-to-image
POST /api/convert/image-to-pdf
POST /api/convert/compress
POST /api/convert/pdf-to-word  ← v2.0

POST   /api/storage/upload-temp
GET    /api/storage/temp/:id
GET    /api/storage/temp/:id/download
DELETE /api/storage/temp/:id
GET    /api/storage/stats
POST   /api/storage/cleanup

POST /api/organize/reorder     ← v2.0
POST /api/organize/duplicate   ← v2.0
POST /api/organize/remove      ← v2.0

POST /api/queue/jobs
GET  /api/queue/jobs/:queue/:id
GET  /api/queue/stats
POST /api/queue/jobs/:queue/:id/retry
GET  /admin/queues             ← Bull Board

GET  /health                   ← all services
```

---

## Documentation Files

### For Frontend Developers
| File | Contents |
|------|---------|
| [API-REFERENCE.md](./API-REFERENCE.md) | Every endpoint — full request/response/errors |
| [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) | FormData, axios, fetch, React/Vue/TS examples |
| [WORKFLOWS.md](./WORKFLOWS.md) | Merge, watermark, reorder, compress, poll jobs |
| [ERROR-HANDLING.md](./ERROR-HANDLING.md) | All error codes, retry logic, user messages |

### Core Docs
| File | Contents |
|------|---------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Start, test, curl examples, troubleshooting |
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Architecture, design decisions, tech stack |
| [03-API-STANDARDS.md](./03-API-STANDARDS.md) | Request/response format, rate limits |
| [04-API-GATEWAY.md](./04-API-GATEWAY.md) | Proxy routes, timing logs |

### Service Docs
| File | Service | Port |
|------|---------|------|
| [06-PDF-SERVICE.md](./06-PDF-SERVICE.md) | PDF operations | 3001 |
| [07-CONVERSION-SERVICE.md](./07-CONVERSION-SERVICE.md) | Format conversions | 3002 |
| [08-STORAGE-SERVICE.md](./08-STORAGE-SERVICE.md) | Guest file storage | 3003 |
| [09-QUEUE-SERVICE.md](./09-QUEUE-SERVICE.md) | BullMQ + Bull Board | 3006 |
| [09-ORGANIZATION-SERVICE.md](./09-ORGANIZATION-SERVICE.md) | Page organization | 3007 |
| [10-SECURITY-SERVICE.md](./10-SECURITY-SERVICE.md) | Protect/unlock/remove-metadata | 3008 |
| [11-METADATA-SERVICE.md](./11-METADATA-SERVICE.md) | Info/page-count/preview | 3009 |

### Quality
| File | Contents |
|------|---------|
| [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) | 287/287 test results, all fixes documented |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Full index with port/status table |
