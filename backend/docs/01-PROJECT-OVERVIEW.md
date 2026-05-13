# PDFKit — Project Overview

**Version:** 2.0.0 — Guest-First PDF Platform  
**Status:** ✅ Production Ready — 287/287 Tests Passing  
**Last Updated:** May 13, 2026

---

## What Is PDFKit?

PDFKit is a **guest-first PDF utility platform** — no signup, no login, no token required for any PDF operation. Upload a file, process it, download the result. Files auto-delete after 1 hour.

Inspired by iLovePDF, Smallpdf, and PDF24, but built as a fully scalable microservice backend.

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway :3000              │
                    │   Pure proxy · Rate limiting · CORS      │
                    │   Request tracing · Timing logs          │
                    └──────────────┬──────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
  ┌───────────────┐      ┌─────────────────┐      ┌────────────────┐
  │  PDF Service  │      │Conversion Service│      │Storage Service │
  │    :3001      │      │     :3002        │      │    :3003       │
  │               │      │                 │      │                │
  │ merge/split   │      │ office→pdf      │      │ upload-temp    │
  │ rotate/extract│      │ pdf→image       │      │ download       │
  │ delete/reorder│      │ image→pdf       │      │ TTL cleanup    │
  │ watermark     │      │ compress        │      │ stats          │
  └───────────────┘      │ pdf→word        │      └────────────────┘
                         └─────────────────┘
          ┌────────────────────────┬────────────────────────┐
          │                        │
          ▼                        ▼
  ┌───────────────┐      ┌─────────────────┐
  │ Queue Service │      │Organization Svc │
  │    :3006      │      │    :3007        │
  │               │      │                 │
  │ BullMQ workers│      │ reorder pages   │
  │ 7 queues      │      │ duplicate pages │
  │ Bull Board UI │      │ remove pages    │
  └───────────────┘      └─────────────────┘

Infrastructure:
  MySQL 8  :3307  ─── File + Job tables (no User table — guest-first)
  Redis 7  :6380  ─── BullMQ queues + rate limit store
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No auth for PDF ops | Instant usability, like iLovePDF |
| 1-hour TTL on all files | Privacy + disk management |
| Streaming uploads/downloads | Memory-safe for 100MB files |
| BullMQ queues | Async processing, retries, Bull Board visibility |
| Per-step timing logs | Every operation logs exactly how long each step took |
| Parallel PDF loading | Merge reads all source files simultaneously |
| Per-route MIME validation | Wrong file type returns 400, not 500 |
| Safe PDF loading | Corrupt/empty PDFs return 400, not 500 |
| Multer error wrapper | Wrong field names return 400, not 500 |

---

## Services

### Active (6 services)

| Service | Port | Responsibility |
|---------|------|---------------|
| api-gateway | 3000 | Single entry point, pure proxy, rate limiting |
| pdf-service | 3001 | merge, split, rotate, extract, delete, reorder, watermark |
| conversion-service | 3002 | office→pdf, pdf→image, image→pdf, compress, pdf→word |
| storage-service | 3003 | guest upload, TTL cleanup, streaming download |
| queue-service | 3006 | BullMQ workers + Bull Board dashboard |
| organization-service | 3007 | reorder, duplicate, remove pages |

### Planned

| Service | Port | Responsibility |
|---------|------|---------------|
| security-service | 3008 | protect, unlock, remove-metadata |
| metadata-service | 3009 | info, page-count, preview generation |

### Removed in v2.0

| Service | Reason |
|---------|--------|
| auth-service | No PDF operation requires auth |
| user-service | Depended on auth; no guest use |
| workers/cleanup-worker | Duplicate — merged into queue-service |
| workers/compression-worker | Duplicate — merged into queue-service |
| workers/libreoffice-worker | Duplicate — merged into queue-service |

---

## File Lifecycle

```
1. Guest uploads file
   POST /api/storage/upload-temp
   → stored in /storage/temp/
   → DB record: { id, path, expiresAt = now + 1 hour }
   → returns { fileId, downloadUrl, expiresAt }
   → downloadUrl points to API Gateway (http://localhost:3000/...)

2. Guest processes file
   POST /api/pdf/merge  (or any operation)
   → output written to /outputs/
   → streamed directly to client
   → output file deleted after download

3. Auto-cleanup
   Every hour: cleanup scheduler deletes files where expiresAt < now
   BullMQ cleanup-jobs worker handles bulk deletions
```

---

## Rate Limits

| Limit | Value |
|-------|-------|
| General | 100 req / 15 min / IP |
| Upload / PDF ops | 100 req / 15 min / IP |
| Heavy ops (compress, pdf-to-word) | 20 req / hour / IP |
| Max upload size | 100 MB |
| File TTL | 1 hour |

> **TEST_MODE=true** raises all limits to 10,000 for automated test runs.

---

## Technology Stack

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

## Database Schema (v2.0 — guest-first)

```prisma
// No User table — all operations are anonymous

model File {
  id           String    @id @default(uuid())
  originalName String
  storedName   String
  mimeType     String
  size         Int
  path         String
  isTemporary  Boolean   @default(true)
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
}

model Job {
  id           String    @id @default(uuid())
  queue        String
  status       String    @default("pending")
  progress     Int       @default(0)
  inputFileId  String?
  outputFileId String?
  error        String?
  createdAt    DateTime  @default(now())
  completedAt  DateTime?
}
```

---

## Timing Logs

Every operation logs per-step timing so you can see exactly where time is spent:

```
▶ pdf-to-word started   { inputSizeKB: 245 }
⚙  exec start           { command: "libreoffice --headless ..." }
⚙  exec done            { elapsedMs: 9241 }
✔ pdf-to-word done      { totalMs: 9244, totalSec: "9.24",
                          steps: [
                            { step: "libreoffice-exec", ms: 9241 },
                            { step: "rename", ms: 2 }
                          ] }
```

```
▶ merge-pdf started     { fileCount: 3 }
✔ merge-pdf done        { totalMs: 312, totalSec: "0.31",
                          steps: [
                            { step: "read-files-parallel", ms: 45 },
                            { step: "parse-pdfs-parallel", ms: 180 },
                            { step: "copy-pages", ms: 62 },
                            { step: "serialize", ms: 18 },
                            { step: "write-file", ms: 7 }
                          ] }
```
