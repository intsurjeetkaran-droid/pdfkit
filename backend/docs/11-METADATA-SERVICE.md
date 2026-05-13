# Metadata Service

**Port:** 3009  
**Version:** 2.0.0  
**No auth required**  
**Tests:** ✅ 28/28 passing

---

## Overview

Read-only PDF analysis — no modification. Extracts metadata, page dimensions, and generates page thumbnails. The frontend needs this service before showing any visual PDF tool UI.

---

## System Dependencies

| Tool | Used for |
|------|---------|
| `pdf-lib` (npm) | info, page-count (in-process, no external tool) |
| `pdftoppm` (poppler-utils) | preview thumbnail generation |

---

## Routes

### POST /api/meta/info

Extract full metadata from a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF, required)
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
- `pdfVersion` — read from the `%PDF-x.y` file header (e.g. `"1.4"`, `"1.7"`, `"2.0"`)
- `fileSizeMB` — 3 decimal places (e.g. `0.001` for small files, not `0`)
- `pages[].widthPt/heightPt` — dimensions in PDF points (1pt = 1/72 inch)
- `pages[].widthMm/heightMm` — dimensions in millimetres
- `pages[].rotation` — page rotation in degrees (0, 90, 180, 270)
- `isEncrypted` — always `false` (pdf-lib can only open unencrypted PDFs)
- `title`, `author`, etc. — `null` when not set in the PDF

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```

**Typical time:** 50–300ms

---

### POST /api/meta/page-count

Fast endpoint — returns only the page count. Use this before showing a reorder/preview UI.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF, required)
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

**Typical time:** 30–150ms

---

### POST /api/meta/preview

Generate a PNG thumbnail of a specific page.

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF, required)
Field: page  (string, optional) — 1-indexed page number, default "1"
Field: dpi   (string, optional) — resolution, default "96", clamped 36–150
```

**Response** `200 OK`
```
Content-Type: image/png
Content-Disposition: inline; filename="preview-page-1.png"
[binary PNG image]
```

**Note:** Response is `inline` (not `attachment`) so browsers can display it directly without downloading.

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid page 999. PDF has 5 pages." }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```

**Typical time:** 500ms – 3s

---

## Frontend Usage Pattern

```javascript
// 1. Get page count before showing reorder UI
const { data: { pageCount } } = await fetch('/api/meta/page-count', {
  method: 'POST', body: formData
}).then(r => r.json());

// 2. Generate thumbnails for each page
const thumbnails = await Promise.all(
  Array.from({ length: pageCount }, (_, i) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('page', String(i + 1));
    fd.append('dpi', '72');
    return fetch('/api/meta/preview', { method: 'POST', body: fd })
      .then(r => r.blob())
      .then(blob => URL.createObjectURL(blob));
  })
);

// 3. Show info panel
const info = await fetch('/api/meta/info', {
  method: 'POST', body: formData
}).then(r => r.json());
console.log(`${info.data.pageCount} pages, ${info.data.fileSizeMB} MB, PDF v${info.data.pdfVersion}`);
```

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Allowed MIME | `application/pdf` only |
| Field name | Must be `"file"` |
| Preview DPI range | 36–150 (clamped) |
