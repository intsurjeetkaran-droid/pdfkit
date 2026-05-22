# PDFKit Backend

**Version:** 3.1.0 — Kubernetes-Ready PDF Platform  
**Status:** ✅ Production Ready — 9 Services + Kubernetes Manifests  
**Last Updated:** May 22, 2026

---

## What Is PDFKit?

A **guest-first PDF utility platform** — no signup, no login, no token required. Upload a file, process it, download the result. Files auto-delete after 1 hour. Inspired by iLovePDF, Smallpdf, and PDF24.

Built as a fully scalable microservice backend with:
- **Docker Compose** for local development
- **Kubernetes** for production with auto-scaling (HPA) up to 1000+ concurrent users
- **MinIO** for shared S3-compatible object storage (required for K8s horizontal scaling)

---

## Quick Start (Docker Compose)

```bash
cd backend

# Start everything including MinIO
docker-compose up --build -d

# Verify all services are healthy
docker-compose ps

# Run tests
node tests/run.js
```

**Services available at:**

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |
| Bull Board (queue dashboard) | http://localhost:3006/admin/queues |

---

## Quick Start (Kubernetes)

```bash
# Prerequisites:
# 1. kubectl configured and pointing to your cluster
# 2. Docker images built and pushed to your registry
# 3. Update image: fields in k8s/*/deployment.yaml with your registry path
# 4. Update k8s/secrets.yaml with real base64-encoded credentials

# Install Metrics Server (required for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install Nginx Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace

# Deploy everything
cd backend/k8s
chmod +x deploy.sh
./deploy.sh

# Watch pods scale
kubectl get hpa -n pdfkit -w

# Check all pods
kubectl get pods -n pdfkit
```

---

## Architecture

### Docker Compose (Local Dev)

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway :3000              │
                    │   Pure proxy · Rate limiting · CORS      │
                    └──────────────┬──────────────────────────┘
                                   │
     ┌─────────┬─────────┬─────────┼─────────┬─────────┬─────────┬─────────┐
     ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼
  :3001     :3002     :3003     :3006     :3007     :3008     :3009     :3010
  PDF      Convert  Storage   Queue     Org     Security  Meta      HTML
  Svc       Svc      Svc      Svc      Svc      Svc      Svc       Svc

Infrastructure:
  MySQL 8  :3307  ─── File + Job metadata (storage-service only)
  Redis 7  :6380  ─── BullMQ queues + rate limit store
  MinIO    :9000  ─── Shared object storage (ALL services read/write here)
```

### Kubernetes (Production)

```
Internet
   │
   ▼
[Nginx Ingress]  ← TLS termination, rate limiting, 100MB body limit
   │
   ▼
[api-gateway  2–10 pods]  ← HPA scales on CPU > 70%
   │
   ├──► [pdf-service       2–10 pods]  HPA CPU > 70%
   ├──► [conversion-service 2–8 pods]  HPA CPU > 65% (LibreOffice heavy)
   ├──► [html-service       2–6 pods]  HPA CPU > 65% (Chromium heavy)
   ├──► [storage-service    2–8 pods]  HPA CPU > 70%
   ├──► [queue-service      2–4 pods]  HPA CPU > 70%
   ├──► [organization-service 2–8 pods] HPA CPU > 70%
   ├──► [security-service   2–8 pods]  HPA CPU > 70%
   └──► [metadata-service   2–8 pods]  HPA CPU > 70%

Infrastructure (StatefulSets):
   MySQL  ─── File metadata (storage-service)
   Redis  ─── BullMQ + rate limiting
   MinIO  ─── Shared object storage (ALL pods read/write — enables horizontal scaling)
```

---

## Why MinIO?

In Docker Compose (single host), each service writes files to local disk. In Kubernetes, pods run on different nodes — Pod A might write a file but Pod B handles the download and can't find it.

**MinIO solves this**: all pods across all services read/write from the same MinIO buckets (`pdfkit-uploads`, `pdfkit-outputs`), regardless of which node they run on. This is the key change that enables horizontal scaling.

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
POST /api/convert/pdf-to-text    — PDF → TXT (pdftotext)
POST /api/convert/svg-to-pdf     — SVG → PDF (sharp + pdf-lib)
POST /api/convert/images-to-pdf  — Multiple images → PDF
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
POST /api/security/protect          — Add AES-256 password (qpdf)
POST /api/security/unlock           — Remove password (qpdf)
POST /api/security/remove-metadata  — Strip title/author/dates/XMP (pdf-lib)
```

### Metadata Service
```
POST /api/meta/info        — Full metadata: pages, dimensions, version, dates
POST /api/meta/page-count  — Fast page count only
POST /api/meta/preview     — PNG thumbnail of any page (pdftoppm)
```

### HTML Service
```
POST /api/html/html-to-pdf     — HTML file → PDF (Chromium)
POST /api/html/url-to-pdf      — URL → PDF (Chromium)
POST /api/html/string-to-pdf   — HTML string → PDF (Chromium)
```

### Health Checks
```
GET /health   — All services expose this endpoint
```

---

## Project Structure

```
backend/
├── api-gateway/              # :3000 — single entry point, pure proxy
├── pdf-service/              # :3001 — all PDF manipulation (pdf-lib)
├── conversion-service/       # :3002 — format conversions (LibreOffice, Ghostscript)
├── storage-service/          # :3003 — guest file storage + TTL (MySQL + MinIO)
├── queue-service/            # :3006 — BullMQ workers + Bull Board
├── organization-service/     # :3007 — page organization (pdf-lib)
├── security-service/         # :3008 — protect/unlock/strip-metadata (qpdf)
├── metadata-service/         # :3009 — info/page-count/preview (pdf-lib + pdftoppm)
├── html-service/             # :3010 — html/url/string → pdf (Chromium)
├── shared/
│   ├── constants/            # MIME types, queue names, HTTP codes
│   ├── logger/               # Global logger factory (createLogger)
│   ├── middleware/           # Error handler, async wrapper, validation
│   ├── types/                # TypeScript interfaces (ApiResponse, FileMetadata, etc.)
│   └── utils/
│       ├── minioClient.ts    # ← NEW: Shared MinIO client for all services
│       ├── timer.ts          # Per-step timing utility
│       ├── asyncHandler.ts   # Express async wrapper
│       └── fileUtils.ts      # File helpers
├── k8s/                      # ← NEW: Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── ingress.yaml
│   ├── deploy.sh             # One-command deployment script
│   ├── infrastructure/
│   │   ├── mysql-statefulset.yaml
│   │   ├── mysql-pvc.yaml
│   │   ├── redis-statefulset.yaml
│   │   └── minio-deployment.yaml
│   ├── api-gateway/          # deployment.yaml + service.yaml + hpa.yaml
│   ├── pdf-service/          # deployment.yaml + hpa.yaml
│   ├── conversion-service/   # deployment.yaml + hpa.yaml
│   ├── storage-service/      # deployment.yaml (includes service + hpa)
│   ├── queue-service/        # deployment.yaml (includes service + hpa)
│   ├── organization-service/ # deployment.yaml (includes service + hpa)
│   ├── security-service/     # deployment.yaml (includes service + hpa)
│   ├── metadata-service/     # deployment.yaml (includes service + hpa)
│   └── html-service/         # deployment.yaml (includes service + hpa)
├── tests/                    # complete test suite
├── docs/                     # full documentation
├── docker-compose.yml        # Local dev (includes MinIO)
└── .env
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
| PDF → Image / Text | pdftoppm, pdftotext (poppler-utils) |
| HTML → PDF | Puppeteer-core + Chromium |
| PDF security | qpdf |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Object Storage | MinIO (S3-compatible) |
| Logging | Winston 3.11 (per-step timing, pod-aware) |
| Containers | Docker + Docker Compose |
| Orchestration | Kubernetes + HPA (auto-scaling) |
| Ingress | Nginx Ingress Controller |

---

## Kubernetes HPA Scaling Table

| Service | Min Pods | Max Pods | CPU Threshold | Notes |
|---------|----------|----------|---------------|-------|
| api-gateway | 2 | 10 | 70% | Lightweight proxy |
| pdf-service | 2 | 10 | 70% | pdf-lib in-process |
| conversion-service | 2 | 8 | 65% | LibreOffice/Ghostscript heavy |
| html-service | 2 | 6 | 65% | Chromium very heavy |
| storage-service | 2 | 8 | 70% | I/O bound |
| queue-service | 2 | 4 | 70% | Conservative — workers are heavy |
| organization-service | 2 | 8 | 70% | pdf-lib in-process |
| security-service | 2 | 8 | 70% | qpdf + pdf-lib |
| metadata-service | 2 | 8 | 70% | pdf-lib + pdftoppm |

---

## Rate Limits

| Limit | Value |
|-------|-------|
| General | 100 req / 15 min / IP |
| Upload / PDF ops | 100 req / 15 min / IP |
| Heavy ops (compress, pdf-to-word, html) | 20 req / hour / IP |
| Max upload size | 100 MB |
| File TTL | 1 hour |
| Nginx Ingress | 100 req/s per IP |

---

## Environment Variables

See [`.env`](./.env) for all configuration. Key variables:

```env
# Service ports
API_GATEWAY_PORT=3000
PDF_SERVICE_PORT=3001
...

# Database
DATABASE_URL=mysql://root:root@localhost:3307/pdfkit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# MinIO (shared object storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_UPLOADS=pdfkit-uploads
MINIO_BUCKET_OUTPUTS=pdfkit-outputs

# File storage
FILE_TTL_MS=3600000          # 1 hour
CLEANUP_INTERVAL_MS=3600000

# Logging
LOG_LEVEL=info
TEST_MODE=true               # raises rate limits for testing
```

---

## Logging

Every service uses Winston with:
- **service**: service name (e.g. "pdf-service")
- **pod**: hostname / K8s pod name (set `POD_NAME` env via Downward API)
- **timestamp**: ISO 8601 with milliseconds
- **Per-step timing**: every operation logs `▶ started`, step timings, `✔ done`

In Kubernetes, stdout JSON logs are collected by your log aggregator (Loki, CloudWatch, Datadog, etc.).

---

## Documentation

Full docs in [`docs/`](./docs/):

- [Getting Started](./docs/GETTING_STARTED.md)
- [API Reference](./docs/API-REFERENCE.md)
- [Kubernetes Guide](./docs/KUBERNETES.md) ← NEW
- [Frontend Integration](./docs/FRONTEND-INTEGRATION.md)
- [Workflows Guide](./docs/WORKFLOWS.md)
- [Error Handling](./docs/ERROR-HANDLING.md)
- [Project Overview](./docs/01-PROJECT-OVERVIEW.md)
