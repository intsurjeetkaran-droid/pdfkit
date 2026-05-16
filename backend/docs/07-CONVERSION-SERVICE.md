# Conversion Service

**Port:** 3002  
**Version:** 3.0.0  
**No auth required**

---

## Overview

Handles all file format conversions. Every handler validates MIME type before calling the external tool — wrong file types return `400`, not `500`.

---

## System Dependencies (Docker)

| Tool | Package | Used for |
|------|---------|---------|
| LibreOffice | `libreoffice` (apk) | office→pdf, pdf→word |
| Ghostscript | `ghostscript` (apk) | PDF compression |
| pdftoppm | `poppler-utils` (apk) | pdf→image |
| pdftotext | `poppler-utils` (apk) | pdf→text |
| sharp | npm | image→pdf, svg→pdf, images→pdf |
| pdf-lib | npm | image→pdf, svg→pdf, images→pdf |

---

## Routes

### POST /api/convert/word-to-pdf
```
Field: file  (DOCX or DOC)
Response: application/pdf
Time: 3–15s (LibreOffice)
```

### POST /api/convert/excel-to-pdf
```
Field: file  (XLSX or XLS)
Response: application/pdf
Time: 3–15s (LibreOffice)
```

### POST /api/convert/ppt-to-pdf
```
Field: file  (PPTX or PPT)
Response: application/pdf
Time: 3–15s (LibreOffice)
```

### POST /api/convert/pdf-to-image
```
Field: file    (PDF)
Field: format  "png" | "jpg"  (default: png)
Field: dpi     72–300         (default: 150)

Single page → binary image stream
Multi-page  → JSON: { pageCount, format, dpi, files: [{ page, filename }] }
Time: 1–5s per page
```

### POST /api/convert/image-to-pdf
```
Field: file  (PNG | JPEG | WebP | TIFF | BMP)
Response: application/pdf
Time: 200–800ms (sharp + pdf-lib, no external tools)
```

### POST /api/convert/compress
```
Field: file     (PDF)
Field: quality  "screen" | "ebook" | "printer" | "prepress"  (default: ebook)

Quality levels:
  screen   → 72 DPI  — smallest, web viewing
  ebook    → 150 DPI — good balance (default)
  printer  → 300 DPI — print quality
  prepress → 300 DPI — professional print, color preserved

Response: application/pdf
Rate limit: 20/hour (heavy op)
Time: 2–30s
```

### POST /api/convert/pdf-to-word
```
Field: file  (PDF)
Response: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Rate limit: 20/hour (heavy op)
Time: 5–30s

Note: Uses --infilter='writer_pdf_import' to force LibreOffice Writer mode
      on Alpine Linux (fixes "no export filter" error on minimal builds).
      Scanned PDFs produce a DOCX with embedded images, not editable text.
```

### POST /api/convert/pdf-to-text ← NEW in v3.0
```
Field: file  (PDF)
Response: text/plain; charset=utf-8  (.txt download)
Time: 10–100ms (pdftotext, very fast)

Uses: pdftotext -layout -enc UTF-8
  -layout  preserves original text layout
  -enc     ensures Unicode output

Note: Text-layer PDFs extract perfectly.
      Scanned PDFs may produce empty or garbled output (no OCR).
```

### POST /api/convert/svg-to-pdf ← NEW in v3.0
```
Field: file         (SVG — image/svg+xml)
Field: pageSize     "A4" | "Letter" | "auto"  (default: A4)
Field: orientation  "portrait" | "landscape"  (default: portrait)

Response: application/pdf
Time: 50–200ms (sharp rasterize + pdf-lib embed)

Page sizes (points):
  A4 portrait:   595.28 × 841.89
  A4 landscape:  841.89 × 595.28
  Letter portrait:  612 × 792
  auto: uses SVG image dimensions

Image is centered and scaled to fit while preserving aspect ratio.
```

### POST /api/convert/images-to-pdf ← NEW in v3.0
```
Field: files        (array of images — up to 50)
                    Accepted: PNG, JPEG, WebP, TIFF, BMP
Field: pageSize     "A4" | "Letter" | "auto"  (default: A4)
Field: orientation  "portrait" | "landscape"  (default: portrait)
Field: margin       0–100 (points, default: 0)
Field: fit          "contain" | "cover" | "stretch"  (default: contain)
Field: order        JSON array of 0-indexed positions (optional)

Response: application/pdf
Time: 50ms per image (sharp + pdf-lib)

Fit modes:
  contain  — scale to fit inside page, preserve aspect ratio (default)
  cover    — scale to fill page, may crop edges
  stretch  — stretch to fill exactly, ignores aspect ratio

Max: 50 images per request
```

---

## MIME Validation

| Route | Accepted types |
|-------|---------------|
| `word/excel/ppt-to-pdf` | DOCX, DOC, XLSX, XLS, PPTX, PPT |
| `pdf-to-image` | `application/pdf` |
| `image-to-pdf` | PNG, JPEG, WebP, TIFF, BMP |
| `compress` | `application/pdf` |
| `pdf-to-word` | `application/pdf` |
| `pdf-to-text` | `application/pdf` |
| `svg-to-pdf` | `image/svg+xml` |
| `images-to-pdf` | PNG, JPEG, WebP, TIFF, BMP (all files validated) |

Wrong type → `400 { "success": false, "message": "Expected X file, got: Y" }`

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Max images (images-to-pdf) | 50 files |
