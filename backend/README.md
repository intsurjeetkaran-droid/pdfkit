# PDFKit Backend

**Version:** 2.0.0 — Guest-First PDF Platform  
**Status:** ✅ Production Ready — 287/287 Tests Passing  
**Last Updated:** May 13, 2026

---

## What Is PDFKit?

A **guest-first PDF utility platform** — no signup, no login, no token required. Upload a file, process it, download the result. Files auto-delete after 1 hour. Inspired by iLovePDF, Smallpdf, and PDF24, built as a fully scalable microservice backend.

---

## Quick Start

```bash
# Start everything (fresh build)
cd backend
docker-compose up --build -d

# Verify all services are healthy
node tests/run.js --only 01

# Run full test suite
node tests/run.js
```

**Services will be available at:**

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| Bull Board (queue dashboard) | http://localhost:3006/admin/queues |

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway :3000              │
                    │   Pure proxy · Rate limiting · CORS      │
                    │   Request tracing · Timing logs          │
                    └──────────────┬──────────────────────────┘
                                   │
     ┌─────────────────────────────┼──────────────────────────────┐
     │                             │                              │
     ▼                             ▼                              ▼
┌───────────────┐       ┌─────────────────┐           ┌────────────────┐
│  PDF Service  │       │Conversion Service│           │Storage Service │
│    :3001      │       │     :3002        │           │    :3003       │
│ merge/split   │       │ office→pdf       │           │ upload-temp    │
│ rotate/extract│       │ pdf→image        │           │ download       │
│ delete/reorder│       │ image→pdf        │           │ TTL cleanup    │
│ watermark     │       │ compress         │           └────────────────┘
└───────────────┘       │ pdf→word         │
                        └─────────────────┘
     ┌─────────────────────────────┬──────────────────────────────┐
     │                             │                              │
     ▼                             ▼                              ▼
┌───────────────┐       ┌─────────────────┐           ┌────────────────┐
│ Queue Service │       │Organization Svc │           │Security Service│
│    :3006      │       │    :3007        │           │    :3008       │
│ BullMQ workers│       │ reorder pages   │           │ protect (qpdf) │
│ 7 queues      │       │ duplicate pages │           │ unlock (qpdf)  │
│ Bull Board UI │       │ remove pages    │           │ remove-metadata│
└───────────────┘       └─────────────────┘           └────────────────┘
                                                       ┌────────────────┐
                                                       │Metadata Service│
                                                       │    :3009       │
                                                       │ info (pdf-lib) │
                                                       │ page-count     │
                                                       │ preview (ppm)  │
                                                       └────────────────┘

Infrastructure:
  MySQL 8  :3307  ─── File + Job tables (no User table — guest-first)
  Redis 7  :6380  ─── BullMQ queues + rate limit store
```

---

## All Public Routes (no auth required)

### PDF Service
```
POST /api/pdf/merge          — Merge 2–20 PDFs into one
POST /api/pdf/split          — Extract specific pages
POST /api/pdf/rotate         — Rotate pages (90/180/270°)
POST /api/pdf/extract        — Extract page range
POST /api/pdf/delete-pages   — Remove specific pages
POST /api/pdf/reorder        — Rearrange pages in custom order
POST /api/pdf/watermark      — Add text or image watermark
```

### Conversion Service
```
POST /api/convert/word-to-pdf    — DOCX/DOC → PDF (LibreOffice)
POST /api/convert/excel-to-pdf   — XLSX/XLS → PDF (LibreOffice)
POST /api/convert/ppt-to-pdf     — PPTX/PPT → PDF (LibreOffice)
POST /api/convert/pdf-to-image   — PDF → PNG/JPG (poppler-utils)
POST /api/convert/image-to-pdf   — PNG/JPEG/WebP → PDF (sharp)
POST /api/convert/compress       — Compress PDF (Ghostscript)
POST /api/convert/pdf-to-word    — PDF → DOCX (LibreOffice)
```

### Storage Service
```
POST   /api/storage/upload-temp          — Upload file (guest, no auth)
GET    /api/storage/temp/:id             — Get file info + download URL
GET    /api/storage/temp/:id/download    — Stream file download
DELETE /api/storage/temp/:id             — Delete file
GET    /api/storage/stats                — Storage statistics
POST   /api/storage/cleanup              — Trigger expired file cleanup
```

### Organization Service
```
POST /api/organize/reorder     — Rearrange pages in custom order
POST /api/organize/duplicate   — Duplicate specific pages
POST /api/organize/remove      — Remove specific pages
```

### Queue Service
```
POST /api/queue/jobs                    — Add job to queue
GET  /api/queue/jobs/:queue/:id         — Get job status + progress
GET  /api/queue/stats                   — All queue counts
POST /api/queue/jobs/:queue/:id/retry   — Retry failed job
GET  /admin/queues                      — Bull Board dashboard
```

### Security Service
```
POST /api/security/protect        — Add AES-256 password (qpdf)
POST /api/security/unlock         — Remove password (qpdf)
POST /api/security/remove-metadata — Strip title/author/dates/XMP (pdf-lib)
```

### Metadata Service
```
POST /api/meta/info               — Full metadata: pages, dimensions, version, dates
POST /api/meta/page-count         — Fast page count only
POST /api/meta/preview            — PNG thumbnail of any page (pdftoppm)
```

### Health Checks
```
GET /health   — All services expose this
```

---

## curl Examples

```bash
# Upload a file
curl -X POST http://localhost:3000/api/storage/upload-temp \
  -F "file=@document.pdf"

# Merge PDFs
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" -F "files=@file2.pdf" \
  -o merged.pdf

# Add watermark
curl -X POST http://localhost:3000/api/pdf/watermark \
  -F "file=@document.pdf" \
  -F "text=CONFIDENTIAL" \
  -F "opacity=0.3" \
  -F "rotation=45" \
  -o watermarked.pdf

# Reorder pages (page 3 first, then 1, then 2)
curl -X POST http://localhost:3000/api/pdf/reorder \
  -F "file=@document.pdf" \
  -F "order=[3,1,2]" \
  -o reordered.pdf

# Compress PDF
curl -X POST http://localhost:3000/api/convert/compress \
  -F "file=@large.pdf" \
  -F "quality=ebook" \
  -o compressed.pdf

# Convert PDF to Word
curl -X POST http://localhost:3000/api/convert/pdf-to-word \
  -F "file=@document.pdf" \
  -o converted.docx

# Rotate all pages 90°
curl -X POST http://localhost:3000/api/pdf/rotate \
  -F "file=@document.pdf" \
  -F "pages=[]" \
  -F "angle=90" \
  -o rotated.pdf
```

---

## Project Structure

```
backend/
├── api-gateway/              # :3000 — single entry point, pure proxy
├── pdf-service/              # :3001 — all PDF manipulation
├── conversion-service/       # :3002 — format conversions
├── storage-service/          # :3003 — guest file storage + TTL
├── queue-service/            # :3006 — BullMQ + Bull Board
├── organization-service/     # :3007 — page organization
├── shared/                   # shared types, constants, timer utility
├── tests/                    # complete test suite (287 tests)
│   ├── helpers.js            # HTTP helpers, file factories
│   ├── run.js                # test runner
│   ├── 01-infrastructure.test.js
│   ├── 02-storage.test.js
│   ├── 03-pdf.test.js
│   ├── 04-conversion.test.js
│   ├── 05-organization.test.js
│   ├── 06-queue.test.js
│   └── 07-edge-cases.test.js
├── docs/                     # full documentation
├── docker-compose.yml
├── .env
└── progress.txt
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5.3 |
| Framework | Express 4.18 |
| PDF manipulation | pdf-lib 1.17 |
| Image processing | sharp 0.33 |
| Office conversion | LibreOffice (headless) |
| PDF compression | Ghostscript |
| PDF → Image | pdftoppm (poppler-utils) |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Logging | Winston 3.11 (per-step timing) |
| Containers | Docker + Docker Compose |

---

## Rate Limits

| Limit | Value |
|-------|-------|
| General | 100 req / 15 min / IP |
| Upload / PDF ops | 100 req / 15 min / IP |
| Heavy ops (compress, pdf-to-word) | 20 req / hour / IP |
| Max upload size | 100 MB |
| File TTL | 1 hour |

---

## Testing

```bash
# All 342 tests
node tests/run.js

# Individual suites
node tests/run.js --only 01   # Infrastructure & health
node tests/run.js --only 02   # Storage service
node tests/run.js --only 03   # PDF service
node tests/run.js --only 04   # Conversion service
node tests/run.js --only 05   # Organization service
node tests/run.js --only 06   # Queue service
node tests/run.js --only 07   # Edge cases & security
node tests/run.js --only 08   # Security service
node tests/run.js --only 09   # Metadata service

# Skip infra checks (faster)
node tests/run.js --skip 01
```

---

## Documentation

Full docs in [`docs/`](./docs/):

- [Getting Started](./docs/GETTING_STARTED.md)
- [API Reference](./docs/API-REFERENCE.md) — every endpoint
- [Frontend Integration](./docs/FRONTEND-INTEGRATION.md) — JS/React/Vue examples
- [Workflows Guide](./docs/WORKFLOWS.md) — common use cases
- [Error Handling](./docs/ERROR-HANDLING.md) — all error codes
- [Project Overview](./docs/01-PROJECT-OVERVIEW.md)

---

## Environment Variables

See [`.env`](./.env) for all configuration. Key variables:

```env
# Service ports
API_GATEWAY_PORT=3000
PDF_SERVICE_PORT=3001
CONVERSION_SERVICE_PORT=3002
STORAGE_SERVICE_PORT=3003
QUEUE_SERVICE_PORT=3006
ORGANIZATION_SERVICE_PORT=3007

# Database
DATABASE_URL=mysql://root:root@localhost:3307/pdfkit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# File storage
FILE_TTL_MS=3600000          # 1 hour
CLEANUP_INTERVAL_MS=3600000  # cleanup every hour
STORAGE_BASE_URL=http://localhost:3000  # public download URL base

# Logging
LOG_LEVEL=info
TEST_MODE=true               # raises rate limits for testing
```
