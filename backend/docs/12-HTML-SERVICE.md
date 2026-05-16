# HTML Service

**Port:** 3010  
**Version:** 3.0.0  
**No auth required**

---

## Overview

Converts HTML content to PDF using headless Chromium via Puppeteer. Supports three input modes: raw HTML string, uploaded HTML file, or a public URL.

Runs as a separate microservice because Chromium adds ~300MB to the Docker image — keeping it isolated means the conversion-service stays lean.

---

## System Dependencies (Docker)

| Tool | Package | Used for |
|------|---------|---------|
| Chromium | `chromium` (apt) | Headless browser rendering |
| Fonts | `fonts-noto`, `fonts-noto-cjk` | Unicode + CJK character support |
| curl | `curl` (apt) | Health check endpoint |

**Environment variable:**
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

---

## Routes

### POST /api/html/string-to-pdf

Convert a raw HTML string to PDF.

**Request** `application/json`
```json
{
  "html": "<html><body><h1>Hello</h1></body></html>",
  "format": "A4",
  "landscape": false,
  "printBackground": true,
  "scale": 1,
  "marginTop": "20mm",
  "marginRight": "15mm",
  "marginBottom": "20mm",
  "marginLeft": "15mm",
  "waitUntil": "networkidle0"
}
```

**Required:** `html` (string, max 5MB)  
**Response:** `200 OK` — `application/pdf`  
**Rate limit:** 20/hour  
**Time:** 1–5s (Chromium startup + render)

**Errors**
```json
400: { "success": false, "message": "html string is required in the request body" }
400: { "success": false, "message": "HTML content too large. Maximum is 5MB" }
```

---

### POST /api/html/file-to-pdf

Convert an uploaded HTML file to PDF.

**Request** `multipart/form-data`
```
Field: file         (HTML file — text/html, .html, .htm)
Field: format       "A4" | "A3" | "Letter" | "Legal" | "Tabloid"  (default: A4)
Field: landscape    "true" | "false"  (default: false)
Field: printBackground  "true" | "false"  (default: true)
Field: scale        "0.1"–"2"  (default: 1)
Field: marginTop    e.g. "20mm"
Field: marginRight  e.g. "15mm"
Field: marginBottom e.g. "20mm"
Field: marginLeft   e.g. "15mm"
Field: waitUntil    "load" | "domcontentloaded" | "networkidle0" | "networkidle2"
```

**Response:** `200 OK` — `application/pdf`  
**Rate limit:** 20/hour  
**Max file size:** 10MB

**Errors**
```json
400: { "success": false, "message": "HTML file is required" }
400: { "success": false, "message": "File is empty (0 bytes)" }
```

---

### POST /api/html/url-to-pdf

Navigate to a public URL and render it as PDF.

**Request** `application/json`
```json
{
  "url": "https://example.com",
  "format": "A4",
  "landscape": false,
  "printBackground": true,
  "scale": 1,
  "waitUntil": "networkidle2"
}
```

**Required:** `url` (must be `http://` or `https://`)  
**Response:** `200 OK` — `application/pdf`  
**Rate limit:** 20/hour  
**Time:** 2–15s (depends on page load time, 30s timeout)

**Security:**
- Only `http://` and `https://` protocols accepted
- `file://`, `data://`, `javascript:` are rejected
- Navigation timeout: 30 seconds

**Errors**
```json
400: { "success": false, "message": "url is required in the request body" }
400: { "success": false, "message": "Invalid URL format" }
400: { "success": false, "message": "Only http and https URLs are supported" }
```

---

## PDF Options Reference

All three routes accept the same PDF rendering options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | string | `"A4"` | Page size: A4, A3, Letter, Legal, Tabloid |
| `landscape` | boolean | `false` | Landscape orientation |
| `printBackground` | boolean | `true` | Include CSS backgrounds and colors |
| `scale` | number | `1` | Page scale factor (0.1–2.0) |
| `marginTop` | string | `"20mm"` | Top margin (CSS units: mm, px, cm) |
| `marginRight` | string | `"15mm"` | Right margin |
| `marginBottom` | string | `"20mm"` | Bottom margin |
| `marginLeft` | string | `"15mm"` | Left margin |
| `waitUntil` | string | varies | When to consider page loaded |

**waitUntil values:**
- `load` — fires when `load` event fires
- `domcontentloaded` — fires when DOM is ready
- `networkidle0` — no network requests for 500ms (default for HTML input)
- `networkidle2` — ≤2 network requests for 500ms (default for URL input)

---

## Chromium Launch Flags

The service launches Chromium with these flags for Docker compatibility:

```
--no-sandbox
--disable-setuid-sandbox
--disable-dev-shm-usage
--disable-gpu
--no-first-run
--no-zygote
--single-process
```

---

## Queue

HTML rendering jobs can be submitted to the `html-jobs` BullMQ queue for async processing:

```json
POST /api/queue/jobs
{
  "queue": "html-jobs",
  "name": "url-to-pdf",
  "data": { "url": "https://example.com" }
}
```

---

## Health Check

```
GET http://localhost:3010/health

{
  "status": "ok",
  "service": "html-service",
  "timestamp": "2026-05-16T08:00:00.000Z",
  "note": "Requires Chromium (puppeteer-core) for HTML/URL to PDF conversion"
}
```
