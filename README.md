# PDFKit

**Guest-First PDF Utility Platform — No Signup Required**  
**Version:** 2.0.0 | **Status:** ✅ Production Ready | **Tests:** 342/342 Passing

> Upload a file, process it, download the result. Files auto-delete after 1 hour. No account needed.  
> Inspired by iLovePDF, Smallpdf, and PDF24 — built as a fully scalable microservice backend.

---

## Quick Start

```bash
cd backend
docker-compose up --build -d

# Verify all 8 services are healthy
node tests/run.js --only 01

# Run full test suite (342 tests)
node tests/run.js
```

**Services available at:**

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

## Services

| Service | Port | Responsibility |
|---------|------|---------------|
| API Gateway | 3000 | Single entry point, pure proxy, rate limiting, CORS |
| PDF Service | 3001 | merge, split, rotate, extract, delete, reorder, watermark |
| Conversion Service | 3002 | office→pdf, pdf→image, image→pdf, compress, pdf→word |
| Storage Service | 3003 | Guest upload, 1-hour TTL auto-cleanup, streaming download |
| Queue Service | 3006 | BullMQ 7 queues + Bull Board visual dashboard |
| Organization Service | 3007 | Reorder, duplicate, remove pages |
| Security Service | 3008 | Protect (AES-256), unlock, remove metadata |
| Metadata Service | 3009 | Info, page count, page preview thumbnail |

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
POST /api/convert/word-to-pdf    — DOCX/DOC → PDF  (LibreOffice)
POST /api/convert/excel-to-pdf   — XLSX/XLS → PDF  (LibreOffice)
POST /api/convert/ppt-to-pdf     — PPTX/PPT → PDF  (LibreOffice)
POST /api/convert/pdf-to-image   — PDF → PNG/JPG   (poppler-utils)
POST /api/convert/image-to-pdf   — Image → PDF     (sharp + pdf-lib)
POST /api/convert/compress       — Compress PDF    (Ghostscript)
POST /api/convert/pdf-to-word    — PDF → DOCX      (LibreOffice)
```

### Storage Service
```
POST   /api/storage/upload-temp          — Upload file (guest, no auth)
GET    /api/storage/temp/:id             — Get file info + download URL
GET    /api/storage/temp/:id/download    — Stream file download
DELETE /api/storage/temp/:id             — Delete file immediately
GET    /api/storage/stats                — Storage statistics
POST   /api/storage/cleanup              — Trigger expired file cleanup
```

### Organization Service
```
POST /api/organize/reorder     — Rearrange pages in custom order
POST /api/organize/duplicate   — Duplicate specific pages
POST /api/organize/remove      — Remove specific pages
```

### Security Service
```
POST /api/security/protect          — Add AES-256 password (qpdf)
POST /api/security/unlock           — Remove password (qpdf)
POST /api/security/remove-metadata  — Strip title/author/dates/XMP (pdf-lib)
```

### Metadata Service
```
POST /api/meta/info         — Full metadata: pages, dimensions, version, dates
POST /api/meta/page-count   — Fast page count only
POST /api/meta/preview      — PNG thumbnail of any page (pdftoppm)
```

### Queue Service
```
POST /api/queue/jobs                    — Add job to queue
GET  /api/queue/jobs/:queue/:id         — Get job status + progress
GET  /api/queue/stats                   — All queue counts
POST /api/queue/jobs/:queue/:id/retry   — Retry failed job
GET  /admin/queues                      — Bull Board dashboard
```

### Health Checks
```
GET /health   — All 8 services expose this
```

---

## curl Examples

```bash
# Upload a file (no auth needed)
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

# Protect with password
curl -X POST http://localhost:3000/api/security/protect \
  -F "file=@document.pdf" \
  -F "userPassword=secret123" \
  -o protected.pdf

# Get PDF metadata
curl -X POST http://localhost:3000/api/meta/info \
  -F "file=@document.pdf"

# Generate page thumbnail
curl -X POST http://localhost:3000/api/meta/preview \
  -F "file=@document.pdf" \
  -F "page=1" \
  -F "dpi=96" \
  -o preview.png
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
| PDF security | qpdf |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Logging | Winston 3.11 (per-step timing) |
| Containers | Docker + Docker Compose |

---

## Testing

```bash
cd backend

# All 342 tests (~19 seconds)
node tests/run.js

# Individual suites
node tests/run.js --only 01   # Infrastructure & health  (51 tests)
node tests/run.js --only 02   # Storage service          (40 tests)
node tests/run.js --only 03   # PDF service              (41 tests)
node tests/run.js --only 04   # Conversion service       (31 tests)
node tests/run.js --only 05   # Organization service     (19 tests)
node tests/run.js --only 06   # Queue service            (75 tests)
node tests/run.js --only 07   # Edge cases & security    (36 tests)
node tests/run.js --only 08   # Security service         (21 tests)
node tests/run.js --only 09   # Metadata service         (28 tests)

# Skip infra checks (faster)
node tests/run.js --skip 01
```

---

## Project Structure

```
pdfkit/
├── backend/
│   ├── api-gateway/              # :3000 — single entry point, pure proxy
│   ├── pdf-service/              # :3001 — all PDF manipulation
│   ├── conversion-service/       # :3002 — format conversions
│   ├── storage-service/          # :3003 — guest file storage + TTL
│   ├── queue-service/            # :3006 — BullMQ + Bull Board
│   ├── organization-service/     # :3007 — page organization
│   ├── security-service/         # :3008 — protect/unlock/remove-metadata
│   ├── metadata-service/         # :3009 — info/page-count/preview
│   ├── shared/                   # shared types, constants, timer utility
│   ├── tests/                    # 9 test files, 342 tests, zero dependencies
│   ├── docs/                     # 18 documentation files
│   ├── docker-compose.yml
│   ├── .env                      # environment variables (not committed)
│   └── progress.txt              # build progress log
└── README.md
```

---

## Documentation

Full docs in [`backend/docs/`](./backend/docs/):

| Doc | Contents |
|-----|---------|
| [Getting Started](./backend/docs/GETTING_STARTED.md) | Setup, curl examples, troubleshooting |
| [API Reference](./backend/docs/API-REFERENCE.md) | Every endpoint — request/response/errors |
| [Frontend Integration](./backend/docs/FRONTEND-INTEGRATION.md) | JS/React/Vue/TS examples |
| [Workflows](./backend/docs/WORKFLOWS.md) | Common use cases with full code |
| [Error Handling](./backend/docs/ERROR-HANDLING.md) | All error codes + retry logic |
| [Project Overview](./backend/docs/01-PROJECT-OVERVIEW.md) | Architecture, design decisions |
| [Verification Report](./backend/docs/VERIFICATION_REPORT.md) | 342/342 test results, all 17 fixes |

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No auth for PDF ops | Instant usability — like iLovePDF |
| 1-hour TTL on all files | Privacy + automatic disk management |
| Streaming uploads/downloads | Memory-safe for 100MB files |
| Per-step timing logs | See exactly how long each step takes |
| Per-route MIME validation | Wrong file type → 400, not 500 |
| qpdf for encryption | Industry-standard AES-256, CLI-based |
| PDF version from file header | Accurate — not from producer metadata field |
| classifyQpdfError() | All qpdf errors mapped to clean 400 messages |

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

## Environment Variables

Create `backend/.env` from this template:

```env
# Service ports
API_GATEWAY_PORT=3000
PDF_SERVICE_PORT=3001
CONVERSION_SERVICE_PORT=3002
STORAGE_SERVICE_PORT=3003
QUEUE_SERVICE_PORT=3006
ORGANIZATION_SERVICE_PORT=3007
SECURITY_SERVICE_PORT=3008
METADATA_SERVICE_PORT=3009

# Database (Docker MySQL)
DATABASE_URL=mysql://root:root@localhost:3307/pdfkit

# Redis (Docker Redis)
REDIS_HOST=localhost
REDIS_PORT=6380

# File storage
FILE_TTL_MS=3600000           # 1 hour TTL
CLEANUP_INTERVAL_MS=3600000   # cleanup every hour
STORAGE_BASE_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
TEST_MODE=true                # raises rate limits for automated testing
```
