# Documentation Index

**PDFKit v3.1 — Kubernetes-Ready PDF Platform**  
**Status:** ✅ 9 Services + Kubernetes Auto-Scaling + MinIO  
**Last Updated:** May 22, 2026

---

## Quick Start

→ [GETTING_STARTED.md](./GETTING_STARTED.md)  
→ [KUBERNETES.md](./KUBERNETES.md) ← **NEW: Deploy to K8s with auto-scaling**

---

## For Frontend Developers

| File | Contents |
|------|---------|
| [**API-REFERENCE.md**](./API-REFERENCE.md) | Every endpoint — full request/response/errors |
| [**FRONTEND-INTEGRATION.md**](./FRONTEND-INTEGRATION.md) | FormData, fetch, blob downloads, React/Vue/TS examples |
| [**WORKFLOWS.md**](./WORKFLOWS.md) | Merge, watermark, compress, HTML→PDF, poll jobs |
| [**ERROR-HANDLING.md**](./ERROR-HANDLING.md) | All error codes, retry logic, user-friendly messages |

---

## Core Docs

| File | Contents |
|------|---------|
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Architecture, design decisions, tech stack, timing logs |
| [03-API-STANDARDS.md](./03-API-STANDARDS.md) | Request/response format, rate limits, file limits |
| [04-API-GATEWAY.md](./04-API-GATEWAY.md) | Proxy routes, timing logs, 503 handling |
| [**KUBERNETES.md**](./KUBERNETES.md) | ← **NEW** K8s deploy, HPA, MinIO, troubleshooting |

---

## Service Docs

| File | Service | Port | Status |
|------|---------|------|--------|
| [06-PDF-SERVICE.md](./06-PDF-SERVICE.md) | merge/split/rotate/extract/delete/reorder/watermark | 3001 | ✅ |
| [07-CONVERSION-SERVICE.md](./07-CONVERSION-SERVICE.md) | 10 conversion operations | 3002 | ✅ |
| [08-STORAGE-SERVICE.md](./08-STORAGE-SERVICE.md) | guest upload, TTL cleanup, streaming download | 3003 | ✅ |
| [09-QUEUE-SERVICE.md](./09-QUEUE-SERVICE.md) | BullMQ 8 queues, Bull Board, job management | 3006 | ✅ |
| [09-ORGANIZATION-SERVICE.md](./09-ORGANIZATION-SERVICE.md) | reorder/duplicate/remove pages | 3007 | ✅ |
| [10-SECURITY-SERVICE.md](./10-SECURITY-SERVICE.md) | protect/unlock/remove-metadata | 3008 | ✅ |
| [11-METADATA-SERVICE.md](./11-METADATA-SERVICE.md) | info/page-count/preview thumbnail | 3009 | ✅ |
| [12-HTML-SERVICE.md](./12-HTML-SERVICE.md) | html→pdf, url→pdf, string→pdf (Chromium) | 3010 | ✅ |

---

## Infrastructure

| Component | Port | Purpose |
|-----------|------|---------|
| MySQL 8 | 3307 | File + Job metadata (storage-service) |
| Redis 7 | 6380 | BullMQ queues + rate limiting |
| MinIO | 9000 | **NEW** Shared object storage (all services) |
| MinIO Console | 9001 | **NEW** Web UI for bucket management |

---

## Kubernetes HPA Scaling

| Service | Min Pods | Max Pods | CPU Threshold |
|---------|----------|----------|---------------|
| api-gateway | 2 | 10 | 70% |
| pdf-service | 2 | 10 | 70% |
| conversion-service | 2 | 8 | 65% |
| html-service | 2 | 6 | 65% |
| storage-service | 2 | 8 | 70% |
| queue-service | 2 | 4 | 70% |
| organization-service | 2 | 8 | 70% |
| security-service | 2 | 8 | 70% |
| metadata-service | 2 | 8 | 70% |

---

## All Routes at a Glance

```
PDF Service (:3001)
  POST /api/pdf/merge
  POST /api/pdf/split
  POST /api/pdf/rotate
  POST /api/pdf/extract
  POST /api/pdf/delete-pages
  POST /api/pdf/reorder
  POST /api/pdf/watermark

Conversion Service (:3002)
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

HTML Service (:3010) ← v3.0
  POST /api/html/string-to-pdf
  POST /api/html/file-to-pdf
  POST /api/html/url-to-pdf

Storage Service (:3003)
  POST   /api/storage/upload-temp
  GET    /api/storage/temp/:id
  GET    /api/storage/temp/:id/download
  DELETE /api/storage/temp/:id
  GET    /api/storage/stats
  POST   /api/storage/cleanup

Organization Service (:3007)
  POST /api/organize/reorder
  POST /api/organize/duplicate
  POST /api/organize/remove

Security Service (:3008)
  POST /api/security/protect
  POST /api/security/unlock
  POST /api/security/remove-metadata

Metadata Service (:3009)
  POST /api/meta/info
  POST /api/meta/page-count
  POST /api/meta/preview

Queue Service (:3006)
  POST /api/queue/jobs
  GET  /api/queue/jobs/:queue/:id
  GET  /api/queue/stats
  POST /api/queue/jobs/:queue/:id/retry
  GET  /admin/queues

Health (all services)
  GET /health
```

---

## Test Commands

```bash
node tests/run.js              # all 342 tests
node tests/run.js --only 01    # infrastructure & health
node tests/run.js --only 02    # storage
node tests/run.js --only 03    # pdf
node tests/run.js --only 04    # conversion
node tests/run.js --only 05    # organization
node tests/run.js --only 06    # queue
node tests/run.js --only 07    # edge cases
node tests/run.js --only 08    # security
node tests/run.js --only 09    # metadata
node tests/run.js --skip 01    # skip infra (faster)
```
