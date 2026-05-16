# Getting Started

**PDFKit v3.0 — Guest-First PDF Platform**  
**11 services · 23 frontend tools · No auth required**

---

## Prerequisites

- Docker Desktop (running)
- Node.js 20+

---

## Start All Services

```bash
cd backend
docker-compose up --build -d
```

This starts **11 containers**:

| Container | Port | Role |
|-----------|------|------|
| pdfkit-mysql | 3307 | MySQL 8 database |
| pdfkit-redis | 6380 | Redis 7 (queues + rate limiting) |
| pdfkit-api-gateway | 3000 | Single entry point |
| pdfkit-pdf-service | 3001 | PDF operations |
| pdfkit-conversion-service | 3002 | Format conversions |
| pdfkit-storage-service | 3003 | Guest file storage |
| pdfkit-queue-service | 3006 | BullMQ + Bull Board |
| pdfkit-organization-service | 3007 | Page organization |
| pdfkit-security-service | 3008 | Protect/unlock/metadata |
| pdfkit-metadata-service | 3009 | Info/preview |
| pdfkit-html-service | 3010 | HTML/URL → PDF (Chromium) |

---

## Start the Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3004 — 23 tools available immediately.

---

## Verify Everything Is Running

```bash
# All containers healthy
docker ps

# Health checks
curl http://localhost:3000/health   # API Gateway
curl http://localhost:3001/health   # PDF Service
curl http://localhost:3002/health   # Conversion Service
curl http://localhost:3003/health   # Storage Service
curl http://localhost:3006/health   # Queue Service
curl http://localhost:3007/health   # Organization Service
curl http://localhost:3008/health   # Security Service
curl http://localhost:3009/health   # Metadata Service
curl http://localhost:3010/health   # HTML Service (NEW)

# Bull Board dashboard
# Open: http://localhost:3006/admin/queues
```

---

## Run Tests

```bash
cd backend

# Full test suite (342 tests, ~19 seconds)
node tests/run.js

# Individual suites
node tests/run.js --only 01   # Infrastructure & health (51 tests)
node tests/run.js --only 02   # Storage service        (40 tests)
node tests/run.js --only 03   # PDF service            (41 tests)
node tests/run.js --only 04   # Conversion service     (31 tests)
node tests/run.js --only 05   # Organization service   (19 tests)
node tests/run.js --only 06   # Queue service          (75 tests)
node tests/run.js --only 07   # Edge cases & security  (36 tests)
node tests/run.js --only 08   # Security service       (21 tests)
node tests/run.js --only 09   # Metadata service       (28 tests)

# Skip infrastructure checks (faster)
node tests/run.js --skip 01
```

---

## Quick API Examples

### PDF Operations

```bash
# Merge PDFs
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" -F "files=@file2.pdf" \
  -o merged.pdf

# Split — extract pages 1, 3, 5
curl -X POST http://localhost:3000/api/pdf/split \
  -F "file=@document.pdf" -F "pages=[1,3,5]" \
  -o split.pdf

# Rotate all pages 90°
curl -X POST http://localhost:3000/api/pdf/rotate \
  -F "file=@document.pdf" -F "angle=90" -F "pages=[]" \
  -o rotated.pdf

# Add watermark
curl -X POST http://localhost:3000/api/pdf/watermark \
  -F "file=@document.pdf" \
  -F "text=CONFIDENTIAL" -F "opacity=0.3" -F "rotation=45" \
  -o watermarked.pdf

# Reorder pages (page 3 first, then 1, then 2)
curl -X POST http://localhost:3000/api/pdf/reorder \
  -F "file=@document.pdf" -F "order=[3,1,2]" \
  -o reordered.pdf
```

### Conversion

```bash
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
  -F "pageSize=A4" -F "fit=contain" -F "margin=10" \
  -o combined.pdf

# Word to PDF
curl -X POST http://localhost:3000/api/convert/word-to-pdf \
  -F "file=@document.docx" \
  -o converted.pdf
```

### HTML Service (NEW)

```bash
# HTML string to PDF
curl -X POST http://localhost:3000/api/html/string-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello PDFKit</h1>","format":"A4","printBackground":true}' \
  -o document.pdf

# URL to PDF
curl -X POST http://localhost:3000/api/html/url-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"A4"}' \
  -o page.pdf

# HTML file to PDF
curl -X POST http://localhost:3000/api/html/file-to-pdf \
  -F "file=@index.html" -F "format=A4" -F "printBackground=true" \
  -o document.pdf
```

### Security & Metadata

```bash
# Protect with password
curl -X POST http://localhost:3000/api/security/protect \
  -F "file=@document.pdf" -F "userPassword=secret123" \
  -o protected.pdf

# Unlock PDF
curl -X POST http://localhost:3000/api/security/unlock \
  -F "file=@protected.pdf" -F "password=secret123" \
  -o unlocked.pdf

# Get full metadata
curl -X POST http://localhost:3000/api/meta/info \
  -F "file=@document.pdf"

# Generate page thumbnail
curl -X POST http://localhost:3000/api/meta/preview \
  -F "file=@document.pdf" -F "page=1" -F "dpi=96" \
  -o preview.png
```

### Storage

```bash
# Upload for sharing (returns 1-hour download link)
curl -X POST http://localhost:3000/api/storage/upload-temp \
  -F "file=@document.pdf"

# Download by ID
curl http://localhost:3000/api/storage/temp/{fileId}/download \
  -o downloaded.pdf

# Delete immediately
curl -X DELETE http://localhost:3000/api/storage/temp/{fileId}
```

---

## Stop All Services

```bash
docker-compose down
```

---

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs pdfkit-conversion-service -f
docker logs pdfkit-html-service -f

# Filter for specific operation
docker logs pdfkit-html-service 2>&1 | grep "url-to-pdf"
docker logs pdfkit-conversion-service 2>&1 | grep "pdf-to-text"
```

---

## Environment Variables

See `backend/.env`. Key variables:

```env
FILE_TTL_MS=3600000           # 1 hour file expiry
CLEANUP_INTERVAL_MS=3600000   # cleanup runs every hour
LOG_LEVEL=info                # debug | info | warn | error
STORAGE_BASE_URL=http://localhost:3000
TEST_MODE=true                # raises rate limits for automated testing
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium  # html-service
```

---

## Troubleshooting

**Services not starting?**
```bash
docker-compose logs api-gateway
docker-compose logs html-service
docker-compose down
docker-compose up --build -d
```

**html-service unhealthy?**
```bash
# Check if curl is available (node:20-slim uses apt, not apk)
docker exec pdfkit-html-service curl -s http://localhost:3010/health
docker logs pdfkit-html-service --tail 20
```

**pdf-to-word fails?**
```bash
# Verify the --infilter fix is compiled in
docker exec pdfkit-conversion-service grep 'infilter' /app/dist/services/conversionService.js
```

**Database tables missing?**
```bash
docker exec -it pdfkit-storage-service npx prisma migrate deploy
```

**Rate limit 429 during tests?**
```bash
# TEST_MODE=true is set in docker-compose — restart gateway
docker-compose up -d api-gateway
```
