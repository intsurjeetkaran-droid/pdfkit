# Getting Started

**PDFKit v2.0 — Guest-First PDF Platform**  
**Status:** ✅ 287/287 Tests Passing

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

This starts 8 containers:
- MySQL 8 on port 3307
- Redis 7 on port 6380
- API Gateway on port 3000
- PDF Service on port 3001
- Conversion Service on port 3002
- Storage Service on port 3003
- Queue Service on port 3006
- Organization Service on port 3007

---

## Verify Everything Is Running

```bash
# Check all containers are healthy
docker ps

# Health checks
curl http://localhost:3000/health   # API Gateway
curl http://localhost:3001/health   # PDF Service
curl http://localhost:3002/health   # Conversion Service
curl http://localhost:3003/health   # Storage Service
curl http://localhost:3006/health   # Queue Service
curl http://localhost:3007/health   # Organization Service

# Bull Board dashboard
# Open in browser: http://localhost:3006/admin/queues
```

---

## Run Tests

```bash
cd backend

# Full test suite (287 tests, ~15 seconds)
node tests/run.js

# Individual suites
node tests/run.js --only 01   # Infrastructure & health
node tests/run.js --only 02   # Storage service
node tests/run.js --only 03   # PDF service
node tests/run.js --only 04   # Conversion service
node tests/run.js --only 05   # Organization service
node tests/run.js --only 06   # Queue service
node tests/run.js --only 07   # Edge cases & security

# Skip infrastructure checks (faster)
node tests/run.js --skip 01
```

---

## Quick API Examples

### Upload a file (no auth needed)

```bash
curl -X POST http://localhost:3000/api/storage/upload-temp \
  -F "file=@document.pdf"
```

Response:
```json
{
  "success": true,
  "data": {
    "fileId": "abc123",
    "downloadUrl": "http://localhost:3000/api/storage/temp/abc123/download",
    "expiresAt": "2026-05-13T11:00:00.000Z"
  }
}
```

### Merge PDFs

```bash
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o merged.pdf
```

### Add watermark

```bash
curl -X POST http://localhost:3000/api/pdf/watermark \
  -F "file=@document.pdf" \
  -F "text=CONFIDENTIAL" \
  -F "opacity=0.3" \
  -F "rotation=45" \
  -o watermarked.pdf
```

### Reorder pages

```bash
curl -X POST http://localhost:3000/api/pdf/reorder \
  -F "file=@document.pdf" \
  -F "order=[3,1,2]" \
  -o reordered.pdf
```

### Convert PDF to Word

```bash
curl -X POST http://localhost:3000/api/convert/pdf-to-word \
  -F "file=@document.pdf" \
  -o converted.docx
```

### Compress PDF

```bash
curl -X POST http://localhost:3000/api/convert/compress \
  -F "file=@large.pdf" \
  -F "quality=ebook" \
  -o compressed.pdf
```

### Duplicate pages

```bash
curl -X POST http://localhost:3000/api/organize/duplicate \
  -F "file=@document.pdf" \
  -F "pages=[2,3]" \
  -o duplicated.pdf
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
docker logs pdfkit-pdf-service -f
docker logs pdfkit-conversion-service -f

# Filter timing logs for a specific operation
docker logs pdfkit-conversion-service 2>&1 | findstr "pdf-to-word"
```

---

## Environment Variables

See `.env` for all configuration. Key variables:

```env
FILE_TTL_MS=3600000          # 1 hour file expiry
CLEANUP_INTERVAL_MS=3600000  # cleanup runs every hour
LOG_LEVEL=info               # debug | info | warn | error
STORAGE_BASE_URL=http://localhost:3000  # base URL for download links
TEST_MODE=true               # raises rate limits for automated testing
```

---

## Troubleshooting

**Services not starting?**
```bash
# Check logs for errors
docker-compose logs api-gateway
docker-compose logs storage-service

# Rebuild from scratch
docker-compose down
docker-compose up --build -d
```

**Database tables missing?**
```bash
# Apply migration manually
docker exec -it pdfkit-storage-service npx prisma migrate deploy
```

**Rate limit 429 during tests?**
```bash
# TEST_MODE=true is set in docker-compose — restart gateway
docker-compose up -d api-gateway
```

**downloadUrl shows internal Docker hostname?**
```bash
# STORAGE_BASE_URL must be set in docker-compose storage-service environment
# It's already configured to http://localhost:3000
```
