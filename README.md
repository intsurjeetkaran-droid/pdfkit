# PDFKit

**Guest-First PDF Utility Platform — No Signup Required**

A production-ready, fully microservice-based PDF processing backend. Upload a file, process it, download the result. Files auto-delete after 1 hour. No account needed.

Inspired by iLovePDF, Smallpdf, and PDF24.

---

## Live Services

| Service | Port | Responsibility |
|---------|------|---------------|
| API Gateway | 3000 | Single entry point, proxy, rate limiting |
| PDF Service | 3001 | merge, split, rotate, extract, delete, reorder, watermark |
| Conversion Service | 3002 | office→pdf, pdf→image, image→pdf, compress, pdf→word |
| Storage Service | 3003 | Guest upload, 1-hour TTL, streaming download |
| Queue Service | 3006 | BullMQ workers + Bull Board dashboard |
| Organization Service | 3007 | Reorder, duplicate, remove pages |
| Security Service | 3008 | Protect (AES-256), unlock, remove metadata |
| Metadata Service | 3009 | Info, page count, page preview thumbnail |

---

## Quick Start

```bash
cd backend
docker-compose up --build -d
```

All 8 services + MySQL + Redis start automatically.

---

## All Public Routes (no auth required)

```
# PDF Operations
POST /api/pdf/merge
POST /api/pdf/split
POST /api/pdf/rotate
POST /api/pdf/extract
POST /api/pdf/delete-pages
POST /api/pdf/reorder
POST /api/pdf/watermark

# Format Conversions
POST /api/convert/word-to-pdf
POST /api/convert/excel-to-pdf
POST /api/convert/ppt-to-pdf
POST /api/convert/pdf-to-image
POST /api/convert/image-to-pdf
POST /api/convert/compress
POST /api/convert/pdf-to-word

# Storage
POST   /api/storage/upload-temp
GET    /api/storage/temp/:id
GET    /api/storage/temp/:id/download
DELETE /api/storage/temp/:id

# Page Organization
POST /api/organize/reorder
POST /api/organize/duplicate
POST /api/organize/remove

# PDF Security
POST /api/security/protect
POST /api/security/unlock
POST /api/security/remove-metadata

# PDF Metadata
POST /api/meta/info
POST /api/meta/page-count
POST /api/meta/preview

# Queue
GET  /api/queue/stats
POST /api/queue/jobs
GET  /api/queue/jobs/:queue/:id

# Health (all services)
GET  /health
```

---

## Example Usage

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
  -o watermarked.pdf

# Compress PDF
curl -X POST http://localhost:3000/api/convert/compress \
  -F "file=@large.pdf" \
  -F "quality=ebook" \
  -o compressed.pdf

# Get PDF info
curl -X POST http://localhost:3000/api/meta/info \
  -F "file=@document.pdf"

# Protect with password
curl -X POST http://localhost:3000/api/security/protect \
  -F "file=@document.pdf" \
  -F "userPassword=secret123" \
  -o protected.pdf

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
# Run all 342 tests
node backend/tests/run.js

# Individual suites
node backend/tests/run.js --only 03   # PDF service
node backend/tests/run.js --only 08   # Security service
node backend/tests/run.js --only 09   # Metadata service
```

**Test results: 342/342 passing (100%)**

---

## Project Structure

```
pdfkit/
├── backend/
│   ├── api-gateway/          # :3000
│   ├── pdf-service/          # :3001
│   ├── conversion-service/   # :3002
│   ├── storage-service/      # :3003
│   ├── queue-service/        # :3006
│   ├── organization-service/ # :3007
│   ├── security-service/     # :3008
│   ├── metadata-service/     # :3009
│   ├── shared/               # shared types, timer utility
│   ├── tests/                # 9 test files, 342 tests
│   ├── docs/                 # 18 documentation files
│   ├── docker-compose.yml
│   └── progress.txt
└── README.md
```

---

## Documentation

Full docs in [`backend/docs/`](./backend/docs/):

| Doc | Contents |
|-----|---------|
| [API Reference](./backend/docs/API-REFERENCE.md) | Every endpoint — request/response/errors |
| [Frontend Integration](./backend/docs/FRONTEND-INTEGRATION.md) | JS/React/Vue examples |
| [Workflows](./backend/docs/WORKFLOWS.md) | Common use cases with code |
| [Error Handling](./backend/docs/ERROR-HANDLING.md) | All error codes |
| [Getting Started](./backend/docs/GETTING_STARTED.md) | Setup, curl examples, troubleshooting |
| [Verification Report](./backend/docs/VERIFICATION_REPORT.md) | 342/342 test results, all fixes |

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

## Environment Setup

Copy `.env.example` (create from `.env` template):

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

# Database
DATABASE_URL=mysql://root:root@localhost:3307/pdfkit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# Storage
FILE_TTL_MS=3600000
STORAGE_BASE_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## Bull Board

Visual queue dashboard — shows all 7 queues with job counts, progress, and retry controls:

```
http://localhost:3006/admin/queues
```
