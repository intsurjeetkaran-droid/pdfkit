# Documentation Index

**PDFKit v2.0 — Guest-First PDF Platform**  
**Status:** ✅ 287/287 Tests Passing  
**Last Updated:** May 13, 2026

---

## Quick Start

→ [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## For Frontend Developers

| File | Contents |
|------|---------|
| [**API-REFERENCE.md**](./API-REFERENCE.md) | Every endpoint — full request/response/errors in one place |
| [**FRONTEND-INTEGRATION.md**](./FRONTEND-INTEGRATION.md) | FormData, axios, fetch, blob downloads, React/Vue/TS examples |
| [**WORKFLOWS.md**](./WORKFLOWS.md) | Merge, watermark, reorder, compress, poll jobs, share links |
| [**ERROR-HANDLING.md**](./ERROR-HANDLING.md) | All error codes, retry logic, user-friendly messages |

---

## Core Docs

| File | Contents |
|------|---------|
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Architecture, design decisions, tech stack, timing logs |
| [03-API-STANDARDS.md](./03-API-STANDARDS.md) | Request/response format, rate limits, file limits |
| [04-API-GATEWAY.md](./04-API-GATEWAY.md) | Proxy routes, timing logs, 503 handling |

---

## Service Docs

| File | Service | Port | Status |
|------|---------|------|--------|
| [06-PDF-SERVICE.md](./06-PDF-SERVICE.md) | merge/split/rotate/extract/delete/reorder/watermark | 3001 | ✅ |
| [07-CONVERSION-SERVICE.md](./07-CONVERSION-SERVICE.md) | office→pdf, pdf→image, image→pdf, compress, pdf→word | 3002 | ✅ |
| [08-STORAGE-SERVICE.md](./08-STORAGE-SERVICE.md) | guest upload, TTL cleanup, streaming download | 3003 | ✅ |
| [09-QUEUE-SERVICE.md](./09-QUEUE-SERVICE.md) | BullMQ workers, Bull Board, job management | 3006 | ✅ |
| [09-ORGANIZATION-SERVICE.md](./09-ORGANIZATION-SERVICE.md) | reorder/duplicate/remove pages | 3007 | ✅ |
| [10-SECURITY-SERVICE.md](./10-SECURITY-SERVICE.md) | protect/unlock/remove-metadata | 3008 | ✅ |
| [11-METADATA-SERVICE.md](./11-METADATA-SERVICE.md) | info/page-count/preview thumbnail | 3009 | ✅ |

---

## Quality & Testing

| File | Contents |
|------|---------|
| [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) | 287/287 test results, all routes verified, all fixes documented |

---

## Removed in v2.0

| Removed | Reason |
|---------|--------|
| `02-AUTHENTICATION.md` | auth-service removed — no auth required for any PDF operation |
| `05-AUTH-SERVICE.md` | auth-service removed |
| `DOCUMENTATION_SUMMARY.md` | v1.0 summary — superseded by README.md and VERIFICATION_REPORT.md |

---

## Service Ports

| Service | Port | Status | Tests |
|---------|------|--------|-------|
| API Gateway | 3000 | ✅ Active | 51 |
| PDF Service | 3001 | ✅ Active | 41 |
| Conversion Service | 3002 | ✅ Active | 31 |
| Storage Service | 3003 | ✅ Active | 40 |
| Queue Service | 3006 | ✅ Active | 75 |
| Organization Service | 3007 | ✅ Active | 19 |
| Security Service | 3008 | ✅ Active | 21 |
| Metadata Service | 3009 | ✅ Active | 28 |
| MySQL | 3307 | ✅ Active | — |
| Redis | 6380 | ✅ Active | — |
| Bull Board | 3006/admin/queues | ✅ Active | — |

---

## Test Commands

```bash
node tests/run.js              # all 342 tests
node tests/run.js --only 01    # infrastructure
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
