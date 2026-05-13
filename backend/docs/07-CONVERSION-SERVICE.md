# Conversion Service

**Port:** 3002  
**Version:** 2.0.0  
**No auth required**  
**Tests:** ✅ 31/31 passing

---

## Overview

Handles all file format conversions. Every handler validates MIME type before calling the external tool, so wrong file types return 400 instead of crashing with 500.

---

## System Dependencies

Must be installed in the Docker container:

| Tool | Used for |
|------|---------|
| LibreOffice | office→pdf, pdf→word |
| Ghostscript (`gs`) | PDF compression |
| poppler-utils (`pdftoppm`) | pdf→image |
| sharp (npm) | image→pdf (no external tool needed) |

---

## MIME Validation

Each route validates the file type before processing:

| Route | Accepted MIME types |
|-------|-------------------|
| `image-to-pdf` | `image/png`, `image/jpeg`, `image/webp`, `image/tiff`, `image/bmp` |
| `pdf-to-image` | `application/pdf` only |
| `compress` | `application/pdf` only |
| `pdf-to-word` | `application/pdf` only |
| `word/excel/ppt-to-pdf` | DOCX, DOC, XLSX, XLS, PPTX, PPT |

Sending the wrong type returns `400` with a clear message, not `500`.

---

## Timing Logs

Every external tool call logs its own elapsed time:

```
▶ pdf-to-word started   { inputSizeKB: 245 }
⚙  exec start           { command: "libreoffice --headless --convert-to docx ..." }
⚙  exec done            { elapsedMs: 9241 }
✔ pdf-to-word done      { totalMs: 9244, totalSec: "9.24",
                          steps: [
                            { step: "libreoffice-exec", ms: 9241 },
                            { step: "rename", ms: 2 }
                          ],
                          inputSizeKB: 245, outputSizeKB: 312 }
```

---

## Routes

### POST /api/convert/word-to-pdf

**Request**
```
Content-Type: multipart/form-data
Field: file  (DOCX or DOC only)
```

**Response** `200 OK` — `application/pdf`  
**Typical time:** 3–15 s (LibreOffice startup + conversion)

**Errors**
```json
400: { "success": false, "message": "File is required" }
400: { "success": false, "message": "Expected Office document (DOCX/XLSX/PPTX) file, got: application/pdf" }
400: { "success": false, "message": "File is empty (0 bytes)" }
```

---

### POST /api/convert/excel-to-pdf

**Request**
```
Field: file  (XLSX or XLS only)
```
**Response** `200 OK` — `application/pdf`  
**Typical time:** 3–15 s

---

### POST /api/convert/ppt-to-pdf

**Request**
```
Field: file  (PPTX or PPT only)
```
**Response** `200 OK` — `application/pdf`  
**Typical time:** 3–15 s

---

### POST /api/convert/pdf-to-image

**Request**
```
Field: file    (PDF only)
Field: format  "png" | "jpg"  (default: png)
Field: dpi     "150"           (default: 150, clamped 72–300)
```

**Response — Single page PDF** `200 OK`
```
Content-Type: image/png  (or image/jpeg)
[binary image stream]
```

**Response — Multi-page PDF** `200 OK`
```json
{
  "success": true,
  "data": {
    "pageCount": 5,
    "format": "png",
    "dpi": 150,
    "files": [
      { "page": 1, "filename": "pdf-img-uuid-001.png" },
      { "page": 2, "filename": "pdf-img-uuid-002.png" }
    ]
  }
}
```

**Errors**
```json
400: { "success": false, "message": "Expected PDF file, got: image/png" }
```

**Typical time:** 1–5 s per page at 150 DPI

---

### POST /api/convert/image-to-pdf

**Request**
```
Field: file  (PNG | JPEG | WebP | TIFF | BMP only)
```

**Response** `200 OK` — `application/pdf`  
**Typical time:** 200–800 ms (sharp + pdf-lib, no external tools)

**Errors**
```json
400: { "success": false, "message": "Expected image (PNG/JPEG/WebP/TIFF/BMP) file, got: application/pdf" }
```

---

### POST /api/convert/compress

**Request**
```
Field: file     (PDF only)
Field: quality  "screen" | "ebook" | "printer" | "prepress"  (default: ebook)
```

**Quality levels:**

| Value | DPI | Use case |
|-------|-----|---------|
| `screen` | 72 | Web viewing, smallest file |
| `ebook` | 150 | Default, good balance |
| `printer` | 300 | Print quality |
| `prepress` | 300 | Professional print, color preserved |

**Note:** Invalid quality values silently fall back to `ebook`.

**Response** `200 OK` — `application/pdf`  
**Rate limit:** 20 per hour (heavy operation)  
**Typical time:** 2–30 s

---

### POST /api/convert/pdf-to-word

**Request**
```
Field: file  (PDF only)
```

**Response** `200 OK`
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="converted.docx"
[binary DOCX stream]
```

**Rate limit:** 20 per hour (heavy operation)  
**Typical time:** 5–30 s

**Note:** LibreOffice's PDF import is text-layer based. Scanned PDFs produce a DOCX with embedded images rather than editable text.

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Allowed MIME types | PDF, PNG, JPEG, WebP, TIFF, BMP, DOCX, DOC, XLSX, XLS, PPTX, PPT |
