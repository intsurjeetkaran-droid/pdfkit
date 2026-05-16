# PDFKit

**Guest-First PDF Utility Platform — No Signup Required**  
**Version:** 3.0.0 | **Status:** ✅ Production Ready | **Services:** 11 running | **Tools:** 23

> Upload a file, process it, download the result. Files auto-delete after 1 hour. No account needed.  
> Inspired by iLovePDF, Smallpdf, and PDF24 — built as a fully scalable microservice backend with a Next.js frontend.

---

## Quick Start

### Backend

```bash
cd backend
docker-compose up --build -d

# Verify all 11 services are healthy
docker ps

# Run full test suite
node tests/run.js
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                  # http://localhost:3004
```

**Services available at:**

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| Frontend | http://localhost:3004 |
| Bull Board (queue dashboard) | http://localhost:3006/admin/queues |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend :3004                        │
│   23 tools · Mobile-first · No auth · Manual download           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────────┐
                    │           API Gateway :3000                  │
                    │   Pure proxy · Rate limiting · CORS          │
                    │   Request tracing · Timing logs              │
                    └──────┬──────────────────────────────────────┘
                           │
   ┌───────────┬───────────┼───────────┬───────────┬──────────────┐
   │           │           │           │           │              │
   ▼           ▼           ▼           ▼           ▼              ▼
:3001       :3002       :3003       :3006       :3007          :3008
PDF Svc  Convert Svc  Storage   Queue Svc   Org Svc       Security Svc
merge     office→pdf   upload    BullMQ      reorder       protect
split     pdf→image    download  8 queues    duplicate     unlock
rotate    image→pdf    TTL       Bull Board  remove        rm-metadata
extract   compress     cleanup
delete    pdf→word
reorder   pdf→text ←NEW
watermark svg→pdf  ←NEW
          imgs→pdf ←NEW
          html→pdf ←NEW via :3010

   ▼                                                           ▼
:3009                                                       :3010
Metadata Svc                                             HTML Svc ←NEW
info                                                     html→pdf
page-count                                               url→pdf
preview                                                  string→pdf
                                                         (Chromium)

Infrastructure:
  MySQL 8  :3307  ─── File + Job tables (no User table — guest-first)
  Redis 7  :6380  ─── BullMQ queues + rate limit store
```

---

## All Services

| Service | Port | Responsibility | Status |
|---------|------|---------------|--------|
| API Gateway | 3000 | Single entry point, pure proxy, rate limiting | ✅ |
| PDF Service | 3001 | merge, split, rotate, extract, delete, reorder, watermark | ✅ |
| Conversion Service | 3002 | office→pdf, pdf→image, image→pdf, compress, pdf→word, **pdf→text, svg→pdf, images→pdf** | ✅ |
| Storage Service | 3003 | Guest upload, 1-hour TTL auto-cleanup, streaming download | ✅ |
| Queue Service | 3006 | BullMQ 8 queues + Bull Board visual dashboard | ✅ |
| Organization Service | 3007 | Reorder, duplicate, remove pages | ✅ |
| Security Service | 3008 | Protect (AES-256), unlock, remove metadata | ✅ |
| Metadata Service | 3009 | Info, page count, page preview thumbnail | ✅ |
| **HTML Service** | **3010** | **html→pdf, url→pdf, string→pdf (Chromium)** | ✅ **NEW** |
| MySQL | 3307 | File + Job tables | ✅ |
| Redis | 6380 | BullMQ queues + rate limiting | ✅ |

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
POST /api/convert/word-to-pdf    — DOCX/DOC → PDF       (LibreOffice)
POST /api/convert/excel-to-pdf   — XLSX/XLS → PDF       (LibreOffice)
POST /api/convert/ppt-to-pdf     — PPTX/PPT → PDF       (LibreOffice)
POST /api/convert/pdf-to-image   — PDF → PNG/JPG        (pdftoppm)
POST /api/convert/image-to-pdf   — Image → PDF          (sharp + pdf-lib)
POST /api/convert/compress       — Compress PDF         (Ghostscript)
POST /api/convert/pdf-to-word    — PDF → DOCX           (LibreOffice + --infilter fix)
POST /api/convert/pdf-to-text    — PDF → TXT            (pdftotext)        ← NEW
POST /api/convert/svg-to-pdf     — SVG → PDF            (sharp + pdf-lib)  ← NEW
POST /api/convert/images-to-pdf  — Multiple images → PDF (sharp + pdf-lib) ← NEW
```

### HTML Service (NEW)
```
POST /api/html/string-to-pdf  — Raw HTML string → PDF  (Puppeteer/Chromium)
POST /api/html/file-to-pdf    — HTML file → PDF        (Puppeteer/Chromium)
POST /api/html/url-to-pdf     — URL → PDF              (Puppeteer/Chromium)
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
POST /api/security/remove-metadata  — Strip title/author/dates/XMP
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
GET /health   — All 9 services expose this endpoint
```

---

## Frontend — 23 Tools

The Next.js frontend at `frontend/` covers every backend endpoint.

### PDF Operations (8 tools)
| Tool | Route |
|------|-------|
| Merge PDF | `/tools/merge` |
| Split PDF | `/tools/split` |
| Rotate PDF | `/tools/rotate` |
| Compress PDF | `/tools/compress` |
| Watermark | `/tools/watermark` |
| Extract Pages | `/tools/extract` |
| Delete Pages | `/tools/delete-pages` |
| Reorder Pages | `/tools/reorder` |

### Convert (10 tools)
| Tool | Route |
|------|-------|
| Word to PDF | `/tools/word-to-pdf` |
| Excel to PDF | `/tools/excel-to-pdf` |
| PPT to PDF | `/tools/ppt-to-pdf` |
| PDF to Word | `/tools/pdf-to-word` |
| PDF to Text | `/tools/pdf-to-text` |
| Image to PDF | `/tools/image-to-pdf` |
| Images to PDF | `/tools/images-to-pdf` |
| PDF to Image | `/tools/pdf-to-image` |
| SVG to PDF | `/tools/svg-to-pdf` |
| HTML to PDF | `/tools/html-to-pdf` |

### Security & Metadata (5 tools)
| Tool | Route |
|------|-------|
| Protect PDF | `/tools/protect` |
| Unlock PDF | `/tools/unlock` |
| Remove Metadata | `/tools/remove-metadata` |
| PDF Info | `/tools/pdf-info` |
| Duplicate Pages | `/tools/duplicate` |

---

## curl Examples

```bash
# Merge PDFs
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" -F "files=@file2.pdf" \
  -o merged.pdf

# Compress PDF
curl -X POST http://localhost:3000/api/convert/compress \
  -F "file=@large.pdf" -F "quality=ebook" \
  -o compressed.pdf

# PDF to Word
curl -X POST http://localhost:3000/api/convert/pdf-to-word \
  -F "file=@document.pdf" \
  -o converted.docx

# PDF to Text (NEW)
curl -X POST http://localhost:3000/api/convert/pdf-to-text \
  -F "file=@document.pdf" \
  -o extracted.txt

# SVG to PDF (NEW)
curl -X POST http://localhost:3000/api/convert/svg-to-pdf \
  -F "file=@logo.svg" -F "pageSize=A4" \
  -o logo.pdf

# Multiple images to PDF (NEW)
curl -X POST http://localhost:3000/api/convert/images-to-pdf \
  -F "files=@img1.png" -F "files=@img2.jpg" \
  -F "pageSize=A4" -F "fit=contain" \
  -o combined.pdf

# HTML string to PDF (NEW)
curl -X POST http://localhost:3000/api/html/string-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello</h1>","format":"A4","printBackground":true}' \
  -o document.pdf

# URL to PDF (NEW)
curl -X POST http://localhost:3000/api/html/url-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"A4"}' \
  -o page.pdf

# Protect with password
curl -X POST http://localhost:3000/api/security/protect \
  -F "file=@document.pdf" -F "userPassword=secret123" \
  -o protected.pdf

# Get PDF metadata
curl -X POST http://localhost:3000/api/meta/info \
  -F "file=@document.pdf"

# Upload for sharing (1-hour link)
curl -X POST http://localhost:3000/api/storage/upload-temp \
  -F "file=@document.pdf"
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5.3 |
| Framework | Express 4.18 |
| PDF manipulation | pdf-lib 1.17 |
| Image processing | sharp 0.33 |
| Office conversion | LibreOffice (headless) |
| PDF compression | Ghostscript |
| PDF → Image / Text | pdftoppm, pdftotext (poppler-utils) |
| HTML → PDF | Puppeteer-core + Chromium |
| PDF security | qpdf |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Logging | Winston 3.11 (per-step timing) |
| Containers | Docker + Docker Compose |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Font | Geist (next/font) |

---

## Project Structure

```
pdfkit/
├── backend/
│   ├── api-gateway/              # :3000 — single entry point, pure proxy
│   ├── pdf-service/              # :3001 — all PDF manipulation
│   ├── conversion-service/       # :3002 — format conversions (10 operations)
│   ├── storage-service/          # :3003 — guest file storage + TTL
│   ├── queue-service/            # :3006 — BullMQ 8 queues + Bull Board
│   ├── organization-service/     # :3007 — page organization
│   ├── security-service/         # :3008 — protect/unlock/remove-metadata
│   ├── metadata-service/         # :3009 — info/page-count/preview
│   ├── html-service/             # :3010 — HTML/URL/string → PDF (Chromium)
│   ├── shared/                   # shared types, constants, timer utility
│   ├── tests/                    # 9 test suites, 342 tests
│   ├── docs/                     # full documentation
│   ├── docker-compose.yml        # 11 containers
│   └── .env                      # environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # homepage — 23 tool cards
│   │   │   ├── layout.tsx        # header + footer
│   │   │   └── tools/            # 23 tool pages
│   │   ├── components/           # ToolCard, FileDropzone, DownloadSuccess…
│   │   ├── lib/
│   │   │   └── api.ts            # full typed API client
│   │   └── types/
│   │       └── pdfkit.ts         # TypeScript types
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Rate Limits

| Limit | Value | Applies to |
|-------|-------|-----------|
| General | 100 req / 15 min / IP | All routes |
| Upload / PDF ops | 100 req / 15 min / IP | `/api/pdf/*`, `/api/convert/*` |
| Heavy ops | 20 req / hour / IP | compress, pdf-to-word, `/api/html/*` |
| Max upload size | 100 MB | All file uploads |
| File TTL | 1 hour | All guest uploads |

> Set `TEST_MODE=true` in `.env` to raise all limits to 10,000 for automated testing.

---

## Environment Variables

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
HTML_SERVICE_PORT=3010

# Service URLs (used by api-gateway)
PDF_SERVICE_URL=http://pdf-service:3001
CONVERSION_SERVICE_URL=http://conversion-service:3002
STORAGE_SERVICE_URL=http://storage-service:3003
QUEUE_SERVICE_URL=http://queue-service:3006
ORGANIZATION_SERVICE_URL=http://organization-service:3007
SECURITY_SERVICE_URL=http://security-service:3008
METADATA_SERVICE_URL=http://metadata-service:3009
HTML_SERVICE_URL=http://html-service:3010

# Database (Docker MySQL)
DATABASE_URL=mysql://root:root@localhost:3307/pdfkit

# Redis (Docker Redis)
REDIS_HOST=localhost
REDIS_PORT=6380

# File storage
FILE_TTL_MS=3600000
CLEANUP_INTERVAL_MS=3600000
STORAGE_BASE_URL=http://localhost:3000

# Chromium (html-service)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Logging
LOG_LEVEL=info
TEST_MODE=true
```

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
node tests/run.js --skip 01   # Skip infra (faster)
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No auth for any PDF op | Instant usability — like iLovePDF |
| 1-hour TTL on all files | Privacy + automatic disk management |
| Streaming uploads/downloads | Memory-safe for 100MB files |
| Per-step timing logs | See exactly how long each step takes |
| Per-route MIME validation | Wrong file type → 400, not 500 |
| `--infilter='writer_pdf_import'` on pdf-to-word | Alpine LibreOffice fix — forces Writer mode for DOCX export |
| Separate html-service | Chromium adds ~300MB; isolated from conversion-service |
| Manual download (frontend) | User controls when to save — no surprise auto-downloads |
| qpdf for encryption | Industry-standard AES-256, CLI-based |
| pdftotext for text extraction | Already in poppler-utils, zero extra dependencies |

---

## Changelog

### v3.0.0 — May 2026
- ✅ Added `html-service` (port 3010) — HTML/URL/string → PDF via Puppeteer + Chromium
- ✅ Added `POST /api/convert/pdf-to-text` — PDF → TXT via pdftotext
- ✅ Added `POST /api/convert/svg-to-pdf` — SVG → PDF via sharp + pdf-lib
- ✅ Added `POST /api/convert/images-to-pdf` — multiple images → PDF (up to 50)
- ✅ Added `POST /api/html/string-to-pdf`, `/file-to-pdf`, `/url-to-pdf`
- ✅ Fixed `pdf-to-word` on Alpine — added `--infilter='writer_pdf_import'`
- ✅ Frontend: 23 tool pages, mobile-first, manual download UX
- ✅ Queue: added `html-jobs` queue (8 total)
- ✅ 11 Docker services, all healthy

### v2.0.0 — May 2026
- ✅ Removed auth-service and user-service (guest-first)
- ✅ Added organization-service, security-service, metadata-service
- ✅ Added watermark, reorder, pdf-to-word
- ✅ Upload limit 20MB → 100MB
- ✅ 1-hour TTL auto-cleanup
- ✅ Per-step timing logs
- ✅ 342/342 tests passing

---

## Documentation

Full docs in [`backend/docs/`](./backend/docs/):

| Doc | Contents |
|-----|---------|
| [Getting Started](./backend/docs/GETTING_STARTED.md) | Setup, curl examples, troubleshooting |
| [API Reference](./backend/docs/API-REFERENCE.md) | Every endpoint — request/response/errors |
| [Frontend Integration](./backend/docs/FRONTEND-INTEGRATION.md) | JS/React/Vue/TS examples |
| [Workflows](./backend/docs/WORKFLOWS.md) | Common use cases with full code |
| [Project Overview](./backend/docs/01-PROJECT-OVERVIEW.md) | Architecture, design decisions |
| [Conversion Service](./backend/docs/07-CONVERSION-SERVICE.md) | All 10 conversion operations |
