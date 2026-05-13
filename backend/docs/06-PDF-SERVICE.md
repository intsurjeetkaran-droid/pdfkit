# PDF Service

**Port:** 3001  
**Version:** 2.0.0  
**No auth required**  
**Tests:** ✅ 41/41 passing

---

## Overview

Handles all PDF manipulation operations using `pdf-lib`. All operations are synchronous (fast enough for direct HTTP requests) and stream the output file directly to the client.

---

## Optimizations

- Source PDFs loaded in **parallel** (`Promise.all`) before merge
- Watermark font embedded **once**, reused across all pages
- All file I/O uses `fs.promises` (async, non-blocking)
- Streaming downloads — output never fully loaded into RAM
- `loadPDF()` helper wraps `PDFDocument.load()` — corrupt/empty PDFs return **400**, not 500

---

## Timing Logs

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

---

## Routes

### POST /api/pdf/merge

Merge 2–20 PDFs into one.

**Request**
```
Content-Type: multipart/form-data
Field: files  (PDF, repeat for each file, min 2, max 20)
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "At least 2 PDF files are required" }
400: { "success": false, "message": "Only PDF files are allowed" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
400: { "success": false, "message": "File is empty (0 bytes)" }
```

---

### POST /api/pdf/split

Extract specific pages into a new PDF.

**Request**
```
Field: file   (PDF)
Field: pages  "[1,3,5]"   (JSON array string, 1-indexed)
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "pages must be a JSON array of integers" }
400: { "success": false, "message": "No valid page numbers. PDF has 3 pages." }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
```

---

### POST /api/pdf/rotate

Rotate pages by 90, 180, or 270 degrees.

**Request**
```
Field: file   (PDF)
Field: pages  "[]"    (empty = all pages, or "[1,3]" for specific pages)
Field: angle  "90"    (90 | 180 | 270 only)
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "angle must be 90, 180, or 270" }
```

---

### POST /api/pdf/extract

Extract a contiguous page range.

**Request**
```
Field: file      (PDF)
Field: fromPage  "2"   (1-indexed, inclusive)
Field: toPage    "5"   (1-indexed, inclusive)
```

**Response** `200 OK` — `application/pdf`

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
Field: file   (PDF)
Field: pages  "[2,4]"   (JSON array string, 1-indexed)
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "pages must be a JSON array of integers" }
400: { "success": false, "message": "Cannot delete all pages from a PDF" }
```

**Note:** Out-of-range page numbers are silently ignored (pages that don't exist can't be deleted).

---

### POST /api/pdf/reorder

Rearrange pages in a custom order.

**Request**
```
Field: file   (PDF)
Field: order  "[3,1,2]"   (JSON array — page 3 first, then 1, then 2)
```

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "order must be a JSON array of page numbers" }
400: { "success": false, "message": "Invalid page numbers: 5, 6. PDF has 3 pages." }
```

**Note:** You can repeat page numbers to duplicate, or omit pages to remove them.

---

### POST /api/pdf/watermark

Add a text or image watermark.

**Request**
```
Field: file            (PDF) — required
Field: text            "CONFIDENTIAL"   (text watermark)
Field: watermarkImage  (PNG or JPEG)    (image watermark — optional)
Field: opacity         "0.3"            (0.0–1.0, default 0.3)
Field: rotation        "45"             (degrees, default 45)
Field: pages           "[1,2]"          (JSON array, empty = all pages)
Field: fontSize        "48"             (for text watermark, default 48)
```

**Note:** Either `text` or `watermarkImage` is required, not both.

**Response** `200 OK` — `application/pdf`

**Errors**
```json
400: { "success": false, "message": "Either text or watermarkImage is required" }
400: { "success": false, "message": "Invalid watermark parameters" }
```

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Allowed MIME | `application/pdf` only (+ `image/png`, `image/jpeg` for watermark image) |
| Max files per merge | 20 |
