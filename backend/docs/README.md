# PDFKit Backend — Documentation

**Version:** 3.0.0 — Guest-First PDF Platform  
**Status:** ✅ Production Ready — 11 Services Running  
**Last Updated:** May 16, 2026

---

## What Changed in v3.0

| Change | Details |
|--------|---------|
| ✅ Added | `html-service` :3010 — HTML/URL/string → PDF via Puppeteer + Chromium |
| ✅ Added | `POST /api/convert/pdf-to-text` — PDF → TXT (pdftotext, poppler-utils) |
| ✅ Added | `POST /api/convert/svg-to-pdf` — SVG → PDF (sharp + pdf-lib) |
| ✅ Added | `POST /api/convert/images-to-pdf` — up to 50 images → single PDF |
| ✅ Added | `POST /api/html/string-to-pdf` — raw HTML string → PDF |
| ✅ Added | `POST /api/html/file-to-pdf` — uploaded HTML file → PDF |
| ✅ Added | `POST /api/html/url-to-pdf` — public URL → PDF |
| ✅ Added | `html-jobs` BullMQ queue (8 queues total) |
| ✅ Fixed | `pdf-to-word` on Alpine — `--infilter='writer_pdf_import'` |
| ✅ Added | Next.js frontend with 23 tool pages |

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
| ✅ Fixed | 17 bugs — wrong MIME → 400, corrupt PDF → 400, qpdf errors → 400 |

---

## Start Everything

```bash
# Backend (11 Docker containers)
cd backend
docker-compose up --build -d

# Verify all healthy
docker ps

# Run tests
node tests/run.js

# Frontend
cd ../frontend
npm install
npm run dev   # http://localhost:3004
```

---

## All Routes (no auth required)

### PDF Service :3001
```
POST /api/pdf/merge
POST /api/pdf/split
POST /api/pdf/rotate
POST /api/pdf/extract
POST /api/pdf/delete-pages
POST /api/pdf/reorder
POST /api/pdf/watermark
```

### Conversion Service :3002
```
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
```

### HTML Service :3010 (NEW in v3.0)
```
POST /api/html/string-to-pdf
POST /api/html/file-to-pdf
POST /api/html/url-to-pdf
```

### Storage Service :3003
```
POST   /api/storage/upload-temp
GET    /api/storage/temp/:id
GET    /api/storage/temp/:id/download
DELETE /api/storage/temp/:id
GET    /api/storage/stats
POST   /api/storage/cleanup
```

### Organization Service :3007
```
POST /api/organize/reorder
POST /api/organize/duplicate
POST /api/organize/remove
```

### Security Service :3008
```
POST /api/security/protect
POST /api/security/unlock
POST /api/security/remove-metadata
```

### Metadata Service :3009
```
POST /api/meta/info
POST /api/meta/page-count
POST /api/meta/preview
```

### Queue Service :3006
```
POST /api/queue/jobs
GET  /api/queue/jobs/:queue/:id
GET  /api/queue/stats
POST /api/queue/jobs/:queue/:id/retry
GET  /admin/queues
```

### Health (all 9 services)
```
GET /health
```

---

## Documentation Files

### For Frontend Developers
| File | Contents |
|------|---------|
| [API-REFERENCE.md](./API-REFERENCE.md) | Every endpoint — full request/response/errors |
| [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) | FormData, fetch, React/Vue/TS examples |
| [WORKFLOWS.md](./WORKFLOWS.md) | Merge, watermark, compress, HTML→PDF workflows |
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
| [07-CONVERSION-SERVICE.md](./07-CONVERSION-SERVICE.md) | Format conversions (10 ops) | 3002 |
| [08-STORAGE-SERVICE.md](./08-STORAGE-SERVICE.md) | Guest file storage | 3003 |
| [09-QUEUE-SERVICE.md](./09-QUEUE-SERVICE.md) | BullMQ + Bull Board | 3006 |
| [09-ORGANIZATION-SERVICE.md](./09-ORGANIZATION-SERVICE.md) | Page organization | 3007 |
| [10-SECURITY-SERVICE.md](./10-SECURITY-SERVICE.md) | Protect/unlock/remove-metadata | 3008 |
| [11-METADATA-SERVICE.md](./11-METADATA-SERVICE.md) | Info/page-count/preview | 3009 |
| [12-HTML-SERVICE.md](./12-HTML-SERVICE.md) | HTML/URL/string → PDF | 3010 |
