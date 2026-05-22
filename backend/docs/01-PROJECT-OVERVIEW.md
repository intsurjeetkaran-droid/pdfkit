# PDFKit — Project Overview

**Version:** 3.1.0 — Kubernetes-Ready PDF Platform  
**Status:** ✅ Production Ready — 9 Services + Kubernetes Auto-Scaling  
**Last Updated:** May 22, 2026

---

## What Is PDFKit?

PDFKit is a **guest-first PDF utility platform** — no signup, no login, no token required for any operation. Upload a file, process it, download the result. Files auto-delete after 1 hour.

Inspired by iLovePDF, Smallpdf, and PDF24 — built as a fully scalable microservice backend with a Next.js frontend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend :3004                        │
│   23 tools · Mobile-first · TypeScript · Tailwind CSS           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────────┐
                    │           API Gateway :3000                  │
                    │   Pure proxy · Rate limiting · CORS          │
                    │   Request tracing · Per-request timing       │
                    └──────┬──────────────────────────────────────┘
                           │
   ┌───────┬───────┬───────┼───────┬───────┬───────┬─────────────┐
   ▼       ▼       ▼       ▼       ▼       ▼       ▼             ▼
:3001   :3002   :3003   :3006   :3007   :3008   :3009         :3010
PDF    Convert  Storage  Queue   Org   Security  Meta          HTML
Svc     Svc     Svc      Svc    Svc     Svc      Svc           Svc

Infrastructure:
  MySQL 8  :3307  ─── File + Job tables (no User table)
  Redis 7  :6380  ─── BullMQ queues + rate limit store
  MinIO    :9000  ─── Shared object storage (all services — K8s scaling)

Kubernetes (Production):
  HPA auto-scales each service: 2 → 10 pods based on CPU
  Nginx Ingress handles TLS + rate limiting at the edge
  MinIO enables stateless pods — any pod can serve any request
```

---

## Services

### Active (9 microservices)

| Service | Port | Responsibility |
|---------|------|---------------|
| api-gateway | 3000 | Single entry point, pure proxy, rate limiting, CORS |
| pdf-service | 3001 | merge, split, rotate, extract, delete, reorder, watermark |
| conversion-service | 3002 | office→pdf, pdf→image, image→pdf, compress, pdf→word, pdf→text, svg→pdf, images→pdf |
| storage-service | 3003 | guest upload, 1-hour TTL, streaming download |
| queue-service | 3006 | BullMQ 8 queues + Bull Board dashboard |
| organization-service | 3007 | reorder, duplicate, remove pages |
| security-service | 3008 | protect (AES-256), unlock, remove-metadata |
| metadata-service | 3009 | info, page-count, preview thumbnail |
| html-service | 3010 | html→pdf, url→pdf, string→pdf (Chromium) |

### Removed in v2.0

| Service | Reason |
|---------|--------|
| auth-service | No PDF operation requires auth |
| user-service | Depended on auth; no guest use |
| workers/cleanup-worker | Merged into queue-service |
| workers/compression-worker | Merged into queue-service |
| workers/libreoffice-worker | Merged into queue-service |

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No auth for any PDF op | Instant usability — like iLovePDF |
| 1-hour TTL on all files | Privacy + automatic disk management |
| Streaming uploads/downloads | Memory-safe for 100MB files |
| BullMQ queues | Async processing, retries, Bull Board visibility |
| Per-step timing logs | Every operation logs exactly how long each step took |
| Per-route MIME validation | Wrong file type → 400, not 500 |
| `--infilter='writer_pdf_import'` | Alpine LibreOffice fix for pdf-to-word |
| Separate html-service | Chromium adds ~300MB — isolated from conversion-service |
| pdftotext for text extraction | Already in poppler-utils, zero extra dependencies |
| Manual download in frontend | User controls when to save — no surprise auto-downloads |

---

## File Lifecycle

```
1. Guest uploads file
   POST /api/storage/upload-temp
   → stored in /storage/temp/
   → DB record: { id, path, expiresAt = now + 1 hour }
   → returns { fileId, downloadUrl, expiresAt }

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
| Heavy ops (compress, pdf-to-word, html/*) | 20 req / hour / IP |
| Max upload size | 100 MB |
| File TTL | 1 hour |

> `TEST_MODE=true` raises all limits to 10,000 for automated test runs.

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
| PDF → Image / Text | pdftoppm, pdftotext (poppler-utils) |
| HTML → PDF | Puppeteer-core + Chromium |
| PDF security | qpdf |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Logging | Winston 3.11 (per-step timing) |
| Containers | Docker + Docker Compose |
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 |

---

## Database Schema (guest-first — no User table)

```prisma
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

Every operation logs per-step timing:

```
▶ pdf-to-word started   { inputSizeKB: 245 }
⚙  exec start           { command: "libreoffice --headless --infilter=..." }
⚙  exec done            { elapsedMs: 9241 }
✔ pdf-to-word done      { totalMs: 9244, steps: [
                            { step: "libreoffice-exec", ms: 9241 },
                            { step: "rename", ms: 2 }
                          ] }

▶ html-file-to-pdf started  { contentLength: 4096 }
✔ html-file-to-pdf done     { totalMs: 1823, steps: [
                                { step: "browser-launch", ms: 890 },
                                { step: "page-set-content", ms: 312 },
                                { step: "page-pdf", ms: 601 },
                                { step: "browser-close", ms: 20 }
                              ] }
```
