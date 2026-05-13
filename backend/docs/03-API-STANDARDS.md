# API Standards

**Version:** 2.0.0  
**Last Updated:** May 13, 2026

---

## Base URL

All requests go through the API Gateway:

```
http://localhost:3000
```

---

## Authentication

**None required.** All PDF operations are public. No `Authorization` header, no `x-user-id` header needed.

---

## Request Format

### File uploads

All file operations use `multipart/form-data`:

```
Content-Type: multipart/form-data; boundary=...
```

| Operation | Field name | Type |
|-----------|-----------|------|
| Single PDF | `file` | PDF file |
| Multiple PDFs | `files` | PDF files (up to 20) |
| PDF + watermark image | `file` + `watermarkImage` | PDF + PNG/JPEG |
| Image conversion | `file` | PNG/JPEG/WebP/TIFF/BMP |
| Office conversion | `file` | DOCX/XLSX/PPTX/DOC/XLS/PPT |

### JSON parameters in multipart

Array parameters are sent as JSON strings in form fields:

```
pages=[1,3,5]       → form field: pages = "[1,3,5]"
order=[3,1,2]       → form field: order = "[3,1,2]"
angle=90            → form field: angle = "90"
```

---

## Response Format

### Success

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### File download

Binary stream with headers:
```
Content-Disposition: attachment; filename="merged.pdf"
Content-Type: application/pdf
```

### Error

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (upload) |
| 400 | Bad request (validation error, invalid params) |
| 404 | Not found |
| 410 | Gone (file expired) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (downstream service down) |

---

## Rate Limiting

Headers returned on every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1715600000
```

Limits:
- **General:** 100 req / 15 min / IP
- **Upload/PDF:** 100 req / 15 min / IP  
- **Heavy ops** (compress, pdf-to-word): 20 req / hour / IP

---

## Request Tracing

Every request gets a unique `x-request-id` header for distributed tracing:

```
x-request-id: a3f8b2c1d4e5f6a7
```

This ID is forwarded to all downstream services and appears in all log entries.

---

## File Limits

| Limit | Value |
|-------|-------|
| Max upload size | 100 MB |
| Max files per merge | 20 |
| Allowed PDF MIME | `application/pdf` |
| Allowed image MIME | `image/png`, `image/jpeg`, `image/webp`, `image/tiff`, `image/bmp` |
| Allowed office MIME | DOCX, XLSX, PPTX, DOC, XLS, PPT |

---

## Health Check

Every service exposes:

```
GET /health

Response:
{
  "status": "ok",
  "service": "service-name",
  "timestamp": "2026-05-13T10:00:00.000Z"
}
```
