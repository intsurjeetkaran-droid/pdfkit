# API Reference

**PDFKit v2.0 — Complete Endpoint Reference**  
**Base URL:** `http://localhost:3000`  
**Auth:** None required

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pdf/merge` | Merge 2–20 PDFs |
| POST | `/api/pdf/split` | Extract specific pages |
| POST | `/api/pdf/rotate` | Rotate pages |
| POST | `/api/pdf/extract` | Extract page range |
| POST | `/api/pdf/delete-pages` | Remove pages |
| POST | `/api/pdf/reorder` | Rearrange pages |
| POST | `/api/pdf/watermark` | Add text/image watermark |
| POST | `/api/convert/word-to-pdf` | DOCX/DOC → PDF |
| POST | `/api/convert/excel-to-pdf` | XLSX/XLS → PDF |
| POST | `/api/convert/ppt-to-pdf` | PPTX/PPT → PDF |
| POST | `/api/convert/pdf-to-image` | PDF → PNG/JPG |
| POST | `/api/convert/image-to-pdf` | Image → PDF |
| POST | `/api/convert/compress` | Compress PDF |
| POST | `/api/convert/pdf-to-word` | PDF → DOCX |
| POST | `/api/storage/upload-temp` | Upload file (guest) |
| GET | `/api/storage/temp/:id` | Get file info |
| GET | `/api/storage/temp/:id/download` | Download file |
| DELETE | `/api/storage/temp/:id` | Delete file |
| GET | `/api/storage/stats` | Storage stats |
| POST | `/api/storage/cleanup` | Trigger cleanup |
| POST | `/api/organize/reorder` | Reorder pages |
| POST | `/api/organize/duplicate` | Duplicate pages |
| POST | `/api/organize/remove` | Remove pages |
| POST | `/api/security/protect` | Add AES-256 password to PDF |
| POST | `/api/security/unlock` | Remove password from PDF |
| POST | `/api/security/remove-metadata` | Strip all metadata |
| POST | `/api/meta/info` | Full PDF metadata extraction |
| POST | `/api/meta/page-count` | Fast page count |
| POST | `/api/meta/preview` | PNG thumbnail of any page |
| POST | `/api/queue/jobs` | Add queue job |
| GET | `/api/queue/jobs/:queue/:id` | Get job status |
| GET | `/api/queue/stats` | Queue stats |
| POST | `/api/queue/jobs/:queue/:id/retry` | Retry failed job |
| GET | `/health` | Gateway health |

---

## PDF Service

### POST /api/pdf/merge

Merge 2–20 PDFs into one document.

**Request**
```
Content-Type: multipart/form-data
Field: files  (PDF, repeat for each file, min 2, max 20)
```

**Response** `200 OK`
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="merged.pdf"
[binary PDF data]
```

**Errors**
```json
400: { "success": false, "message": "At least 2 PDF files are required" }
400: { "success": false, "message": "Only PDF files are allowed" }
413: { "success": false, "message": "File too large. Maximum size is 100MB" }
```

---

### POST /api/pdf/split

Extract specific pages into a new PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: pages  (string) — JSON array of 1-indexed page numbers
              Example: "[1,3,5]"
```

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data]
```

**Errors**
```json
400: { "success": false, "message": "pages must be a JSON array of integers" }
400: { "success": false, "message": "No valid page numbers. PDF has 3 pages." }
```

---

### POST /api/pdf/rotate

Rotate pages by 90, 180, or 270 degrees.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: pages  (string) — JSON array of 1-indexed page numbers, or "[]" for all pages
Field: angle  (string) — "90" | "180" | "270"
```

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data]
```

**Errors**
```json
400: { "success": false, "message": "angle must be 90, 180, or 270" }
```

---

### POST /api/pdf/extract

Extract a contiguous range of pages.

**Request**
```
Content-Type: multipart/form-data
Field: file      (PDF)
Field: fromPage  (string) — start page, 1-indexed
Field: toPage    (string) — end page, 1-indexed (inclusive)
```

**Example:** Extract pages 2–5 from a 10-page PDF
```
fromPage = "2"
toPage   = "5"
```

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data — 4 pages]
```

**Errors**
```json
400: { "success": false, "message": "fromPage and toPage are required integers" }
400: { "success": false, "message": "Invalid range 2–15. PDF has 10 pages." }
```

---

### POST /api/pdf/delete-pages

Remove specific pages from a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: pages  (string) — JSON array of 1-indexed page numbers to remove
              Example: "[2,4,6]"
```

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data — without deleted pages]
```

**Errors**
```json
400: { "success": false, "message": "pages must be a JSON array of integers" }
400: { "success": false, "message": "Cannot delete all pages from a PDF" }
```

---

### POST /api/pdf/reorder

Rearrange pages in a custom order.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: order  (string) — JSON array defining the new page order (1-indexed)
              Example: "[3,1,2]" → page 3 first, then 1, then 2
```

**Note:** The `order` array defines which pages appear and in what sequence. You can also use it to remove pages (omit them from the array) or repeat pages (include a page number twice).

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data]
```

**Errors**
```json
400: { "success": false, "message": "order must be a JSON array of page numbers" }
400: { "success": false, "message": "Invalid page numbers: 5, 6. PDF has 3 pages." }
```

---

### POST /api/pdf/watermark

Add a text or image watermark to a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file            (PDF) — required
Field: text            (string) — watermark text, e.g. "CONFIDENTIAL"
Field: watermarkImage  (PNG or JPEG) — image watermark (optional)
Field: opacity         (string) — 0.0 to 1.0, default "0.3"
Field: rotation        (string) — degrees, default "45"
Field: pages           (string) — JSON array of 1-indexed pages, or omit for all pages
Field: fontSize        (string) — font size for text watermark, default "48"
```

**Note:** Either `text` or `watermarkImage` is required, not both.

**Response** `200 OK`
```
Content-Type: application/pdf
[binary PDF data]
```

**Errors**
```json
400: { "success": false, "message": "Either text or watermarkImage is required" }
400: { "success": false, "message": "Invalid watermark parameters" }
```

---

## Conversion Service

### POST /api/convert/word-to-pdf

Convert a Word document to PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file  (DOCX or DOC)
```

**Response** `200 OK`
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="converted.pdf"
[binary PDF data]
```

**Typical time:** 3–15 seconds (LibreOffice startup + conversion)

---

### POST /api/convert/excel-to-pdf

Convert an Excel spreadsheet to PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file  (XLSX or XLS)
```

**Response** `200 OK` — `application/pdf`

**Typical time:** 3–15 seconds

---

### POST /api/convert/ppt-to-pdf

Convert a PowerPoint presentation to PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PPTX or PPT)
```

**Response** `200 OK` — `application/pdf`

**Typical time:** 3–15 seconds

---

### POST /api/convert/pdf-to-image

Convert PDF pages to images.

**Request**
```
Content-Type: multipart/form-data
Field: file    (PDF)
Field: format  (string) — "png" | "jpg", default "png"
Field: dpi     (string) — resolution, default "150", range 72–300
```

**Response — Single page PDF** `200 OK`
```
Content-Type: image/png  (or image/jpeg)
[binary image data]
```

**Response — Multi-page PDF** `200 OK`
```json
{
  "success": true,
  "message": "PDF converted to 5 images",
  "data": {
    "pageCount": 5,
    "format": "png",
    "dpi": 150,
    "files": [
      { "page": 1, "filename": "pdf-img-abc123-001.png" },
      { "page": 2, "filename": "pdf-img-abc123-002.png" },
      { "page": 3, "filename": "pdf-img-abc123-003.png" },
      { "page": 4, "filename": "pdf-img-abc123-004.png" },
      { "page": 5, "filename": "pdf-img-abc123-005.png" }
    ]
  }
}
```

**Typical time:** 1–5 seconds per page at 150 DPI

---

### POST /api/convert/image-to-pdf

Convert an image to a PDF document.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PNG | JPEG | WebP | TIFF | BMP)
```

**Response** `200 OK` — `application/pdf`

**Typical time:** 200–800 ms (no external tools)

---

### POST /api/convert/compress

Compress a PDF using Ghostscript.

**Request**
```
Content-Type: multipart/form-data
Field: file     (PDF)
Field: quality  (string) — "screen" | "ebook" | "printer" | "prepress"
                default: "ebook"
```

**Quality levels:**

| Value | DPI | Use case |
|-------|-----|---------|
| `screen` | 72 | Web viewing, smallest file |
| `ebook` | 150 | Default, good balance |
| `printer` | 300 | Print quality |
| `prepress` | 300 | Professional print, color preserved |

**Response** `200 OK` — `application/pdf`

**Rate limit:** 20 requests per hour (heavy operation)  
**Typical time:** 2–30 seconds

---

### POST /api/convert/pdf-to-word

Convert a PDF to a Word document (DOCX).

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF)
```

**Response** `200 OK`
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="converted.docx"
[binary DOCX data]
```

**Rate limit:** 20 requests per hour (heavy operation)  
**Typical time:** 5–30 seconds  
**Note:** Text-layer based. Scanned PDFs produce a DOCX with embedded images.

---

## Storage Service

### POST /api/storage/upload-temp

Upload a file anonymously. Returns a fileId and download URL.

**Request**
```
Content-Type: multipart/form-data
Field: file  (any supported type)
```

**Response** `201 Created`
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "downloadUrl": "http://localhost:3000/api/storage/temp/550e8400.../download",
    "expiresAt": "2026-05-13T11:00:00.000Z"
  }
}
```

**File TTL:** 1 hour from upload time

---

### GET /api/storage/temp/:id

Get metadata for an uploaded file.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "isTemporary": true,
    "expiresAt": "2026-05-13T11:00:00.000Z",
    "downloadUrl": "http://localhost:3000/api/storage/temp/550e8400.../download",
    "createdAt": "2026-05-13T10:00:00.000Z"
  }
}
```

**Errors**
```json
404: { "success": false, "message": "File not found" }
410: { "success": false, "message": "File has expired and is no longer available" }
```

---

### GET /api/storage/temp/:id/download

Download a file by ID.

**Response** `200 OK`
```
Content-Disposition: attachment; filename="document.pdf"
Content-Type: application/pdf
Content-Length: 102400
[binary file data]
```

**Errors**
```json
404: { "success": false, "message": "File not found on disk" }
410: { "success": false, "message": "File has expired and is no longer available" }
```

---

### DELETE /api/storage/temp/:id

Delete a file immediately (before TTL expiry).

**Response** `200 OK`
```json
{ "success": true, "message": "File deleted successfully" }
```

---

### GET /api/storage/stats

Get storage statistics.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalFiles": 42,
    "tempFiles": 38,
    "totalSizeBytes": 10485760,
    "totalSizeMB": 10.0,
    "diskUsage": {
      "tempDirBytes": 8388608,
      "processedDirBytes": 2097152
    }
  }
}
```

---

### POST /api/storage/cleanup

Manually trigger deletion of all expired files.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Cleanup completed",
  "data": { "deletedCount": 12 }
}
```

---

## Organization Service

### POST /api/organize/reorder

Rearrange pages in a custom order.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: order  (string) — JSON array of page numbers in desired order
              Example: "[3,1,2]"
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "order must be a non-empty JSON array" }
400: { "success": false, "message": "Invalid page numbers: 5. PDF has 3 pages." }
```

---

### POST /api/organize/duplicate

Duplicate specific pages (each duplicate is inserted right after the original).

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: pages  (string) — JSON array of 1-indexed page numbers to duplicate
              Example: "[2,3]"
```

**Response** `200 OK` — `application/pdf`

---

### POST /api/organize/remove

Remove specific pages from a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file   (PDF)
Field: pages  (string) — JSON array of 1-indexed page numbers to remove
              Example: "[1,4]"
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "Cannot remove all pages from a PDF" }
```

---

## Queue Service

### POST /api/queue/jobs

Add a job to a queue for async processing.

**Request** `application/json`
```json
{
  "queue": "pdf-jobs",
  "name": "merge-pdf",
  "data": {
    "files": ["/path/a.pdf", "/path/b.pdf"],
    "outputPath": "/path/merged.pdf"
  }
}
```

**Valid queue names:**
- `pdf-jobs`
- `conversion-jobs`
- `compression-jobs`
- `cleanup-jobs`
- `organization-jobs`
- `security-jobs`
- `metadata-jobs`

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "jobId": "42",
    "queue": "pdf-jobs",
    "name": "merge-pdf"
  }
}
```

**Errors**
```json
400: { "success": false, "message": "Unknown queue: bad-queue. Valid queues: pdf-jobs, ..." }
```

---

### GET /api/queue/jobs/:queue/:id

Get the status and progress of a job.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "42",
    "name": "merge-pdf",
    "state": "completed",
    "progress": 100,
    "data": { "files": [...] },
    "returnvalue": { "success": true, "jobId": "42", "elapsedMs": 312 },
    "failedReason": null,
    "attemptsMade": 1,
    "createdAt": "2026-05-13T10:00:00.000Z",
    "processedAt": "2026-05-13T10:00:00.050Z",
    "finishedAt": "2026-05-13T10:00:00.362Z"
  }
}
```

**Job states:**

| State | Meaning |
|-------|---------|
| `waiting` | In queue, not yet picked up |
| `active` | Currently being processed |
| `completed` | Finished successfully |
| `failed` | Failed after all retry attempts |
| `delayed` | Waiting for retry backoff |
| `paused` | Queue is paused |

---

### GET /api/queue/stats

Get job counts for all queues.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "pdf-jobs":          { "waiting": 0, "active": 1, "completed": 42, "failed": 0, "delayed": 0 },
    "conversion-jobs":   { "waiting": 2, "active": 1, "completed": 18, "failed": 1, "delayed": 0 },
    "compression-jobs":  { "waiting": 0, "active": 0, "completed": 7,  "failed": 0, "delayed": 0 },
    "cleanup-jobs":      { "waiting": 0, "active": 0, "completed": 24, "failed": 0, "delayed": 0 },
    "organization-jobs": { "waiting": 0, "active": 0, "completed": 5,  "failed": 0, "delayed": 0 },
    "security-jobs":     { "waiting": 0, "active": 0, "completed": 0,  "failed": 0, "delayed": 0 },
    "metadata-jobs":     { "waiting": 0, "active": 0, "completed": 0,  "failed": 0, "delayed": 0 }
  }
}
```

---

### POST /api/queue/jobs/:queue/:id/retry

Retry a failed job.

**Response** `200 OK`
```json
{ "success": true, "message": "Job queued for retry" }
```

---

## Health Checks

All services expose `GET /health`:

```json
{
  "status": "ok",
  "service": "pdf-service",
  "timestamp": "2026-05-13T10:00:00.000Z"
}
```

| Service | URL |
|---------|-----|
| API Gateway | `http://localhost:3000/health` |
| PDF Service | `http://localhost:3001/health` |
| Conversion Service | `http://localhost:3002/health` |
| Storage Service | `http://localhost:3003/health` |
| Queue Service | `http://localhost:3006/health` |
| Organization Service | `http://localhost:3007/health` |

---

## Rate Limits

| Limit | Value | Applies to |
|-------|-------|-----------|
| General | 100 / 15 min | All routes |
| Upload/PDF | 100 / 15 min | `/api/pdf/*`, `/api/convert/*`, `/api/organize/*` |
| Heavy ops | 20 / hour | `/api/convert/compress`, `/api/convert/pdf-to-word` |

Rate limit headers on every response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1715600000
```

When exceeded:
```json
429: { "success": false, "message": "Upload limit reached. Please try again later." }
```

---

## File Limits

| Limit | Value |
|-------|-------|
| Max upload size | 100 MB |
| Max files per merge | 20 |
| File TTL | 1 hour |
| Allowed PDF MIME | `application/pdf` |
| Allowed image MIME | `image/png`, `image/jpeg`, `image/webp`, `image/tiff`, `image/bmp` |
| Allowed office MIME | `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-powerpoint` |

---

## Security Service

### POST /api/security/protect

Add AES-256 password protection to a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file           (PDF) — required
Field: userPassword   (string) — required, password to open the PDF
Field: ownerPassword  (string) — optional, password to change permissions
                      defaults to userPassword if not provided
```

**Response** `200 OK` — `application/pdf` (encrypted PDF download)

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "userPassword is required" }
400: { "success": false, "message": "Only PDF files are accepted. Got: image/png" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
400: { "success": false, "message": "PDF security operation failed. The file may be corrupt or unsupported." }
```

---

### POST /api/security/unlock

Remove password from a PDF. Requires the current password.

**Request**
```
Content-Type: multipart/form-data
Field: file      (PDF) — required, password-protected PDF
Field: password  (string) — required, current password
```

**Response** `200 OK` — `application/pdf` (decrypted PDF download)

**Note:** If the PDF is not password-protected, qpdf copies it as-is and returns 200.

**Errors**
```json
400: { "success": false, "message": "password is required to unlock the PDF" }
400: { "success": false, "message": "Incorrect password. Cannot unlock this PDF." }
400: { "success": false, "message": "Invalid or corrupt PDF: qpdf could not process this file." }
```

---

### POST /api/security/remove-metadata

Strip all embedded metadata from a PDF (title, author, dates, XMP stream).

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF) — required
```

**Response** `200 OK` — `application/pdf` (metadata-stripped PDF download)

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
400: { "success": false, "message": "Failed to process PDF: ..." }
```

---

## Metadata Service

### POST /api/meta/info

Extract full metadata from a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF) — required
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "PDF metadata extracted",
  "data": {
    "pageCount": 5,
    "fileSizeBytes": 102400,
    "fileSizeKB": 100,
    "fileSizeMB": 0.098,
    "pdfVersion": "1.7",
    "title": "My Document",
    "author": "John Doe",
    "subject": null,
    "keywords": null,
    "creator": "Microsoft Word",
    "producer": "Adobe PDF Library",
    "creationDate": "2026-01-15T10:30:00.000Z",
    "modDate": "2026-05-13T09:00:00.000Z",
    "isEncrypted": false,
    "pages": [
      {
        "page": 1,
        "widthPt": 612,
        "heightPt": 792,
        "widthMm": 216,
        "heightMm": 279,
        "rotation": 0
      }
    ]
  }
}
```

**Field notes:**
- `pdfVersion` — from `%PDF-x.y` file header (e.g. `"1.4"`, `"1.7"`, `"2.0"`)
- `fileSizeMB` — 3 decimal places (e.g. `0.001` not `0` for small files)
- `pages[].widthPt/heightPt` — PDF points (1pt = 1/72 inch)
- `pages[].widthMm/heightMm` — millimetres
- `isEncrypted` — always `false` (pdf-lib only opens unencrypted PDFs)
- String fields — `null` when not set in the PDF

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```

---

### POST /api/meta/page-count

Fast page count only. Use before showing a reorder/preview UI.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF) — required
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Page count retrieved",
  "data": { "pageCount": 5 }
}
```

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```

---

### POST /api/meta/preview

Generate a PNG thumbnail of a specific page.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF) — required
Field: page  (string) — 1-indexed page number, default "1"
Field: dpi   (string) — resolution 36–150, default "96"
```

**Response** `200 OK`
```
Content-Type: image/png
Content-Disposition: inline; filename="preview-page-1.png"
[binary PNG image]
```

**Note:** `inline` disposition — browsers display it directly without downloading.

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid page 999. PDF has 5 pages." }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```
