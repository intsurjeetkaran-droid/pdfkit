# PDFKit Frontend

**Next.js 15 · TypeScript · Tailwind CSS v4 · Mobile-First**  
**23 tools · No signup · Manual download · Files deleted in 1 hour**

---

## Overview

The PDFKit frontend is a Next.js App Router application that provides a clean, mobile-first UI for all 23 PDF tools backed by the PDFKit microservice API.

Key UX decisions:
- **No auto-download** — files are held in memory as a Blob; user clicks a Download button to save
- **Mobile-first** — 2-column grid on mobile, 3-col on tablet, 4-col on desktop
- **No auth** — every tool works instantly, no account needed
- **Accessible** — ARIA labels, keyboard navigation, focus rings throughout

---

## Setup

```bash
# 1. Make sure the backend is running
cd ../backend && docker-compose up -d

# 2. Install dependencies
cd ../frontend
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port

# 4. Start dev server
npm run dev
```

Open **http://localhost:3004**

---

## Environment

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, set `NEXT_PUBLIC_API_URL` to your deployed API Gateway URL.

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — Header + Footer
│   │   ├── page.tsx            # Homepage — 23 tool cards in 3 groups
│   │   ├── globals.css         # Design tokens, animations, base styles
│   │   └── tools/
│   │       ├── merge/          # Merge 2–20 PDFs
│   │       ├── split/          # Extract specific pages
│   │       ├── rotate/         # Rotate pages 90/180/270°
│   │       ├── compress/       # Ghostscript compression
│   │       ├── watermark/      # Text watermark with live preview
│   │       ├── extract/        # Extract page range
│   │       ├── delete-pages/   # Remove specific pages
│   │       ├── reorder/        # Rearrange pages
│   │       ├── word-to-pdf/    # DOCX/DOC → PDF
│   │       ├── excel-to-pdf/   # XLSX/XLS → PDF
│   │       ├── ppt-to-pdf/     # PPTX/PPT → PDF
│   │       ├── pdf-to-word/    # PDF → DOCX
│   │       ├── pdf-to-text/    # PDF → TXT
│   │       ├── image-to-pdf/   # Single image → PDF
│   │       ├── images-to-pdf/  # Multiple images → PDF
│   │       ├── pdf-to-image/   # PDF → PNG/JPG
│   │       ├── svg-to-pdf/     # SVG → PDF
│   │       ├── html-to-pdf/    # URL / HTML code / HTML file → PDF
│   │       ├── protect/        # AES-256 password protection
│   │       ├── unlock/         # Remove password
│   │       ├── remove-metadata/# Strip all metadata
│   │       ├── pdf-info/       # View full metadata
│   │       └── duplicate/      # Duplicate pages
│   │
│   ├── components/
│   │   ├── Header.tsx          # Sticky header, dropdown nav (desktop),
│   │   │                       # accordion nav (mobile)
│   │   ├── Footer.tsx          # Trust strip + branding
│   │   ├── ToolCard.tsx        # Homepage tool grid card
│   │   ├── ToolLayout.tsx      # Shared tool page wrapper
│   │   ├── FileDropzone.tsx    # Drag-and-drop + click-to-browse
│   │   ├── FileList.tsx        # File list with remove buttons (merge)
│   │   ├── DownloadSuccess.tsx # Success state with manual Download button
│   │   └── ui/
│   │       ├── Alert.tsx       # Error / success / info banners
│   │       ├── Badge.tsx       # Colored pill badges
│   │       ├── Button.tsx      # Primary / ghost / danger variants
│   │       ├── Input.tsx       # Labeled input with hint + error
│   │       └── Spinner.tsx     # Loading spinner
│   │
│   ├── lib/
│   │   ├── api.ts              # Full typed API client (all 30+ endpoints)
│   │   └── cn.ts               # clsx helper for conditional classes
│   │
│   └── types/
│       └── pdfkit.ts           # TypeScript types matching backend v3.0
│
├── .env.example                # Environment template
└── package.json
```

---

## API Client

`src/lib/api.ts` covers every backend endpoint with full TypeScript types:

```typescript
// PDF operations
mergePDFs(files)
splitPDF(file, pages)
rotatePDF(file, angle, pages?)
extractPages(file, fromPage, toPage)
deletePages(file, pages)
reorderPages(file, order)
addWatermark(file, options)

// Conversion
wordToPDF(file)
excelToPDF(file)
pptToPDF(file)
pdfToWord(file)
pdfToText(file)
pdfToImage(file, format?, dpi?)
imageToPDF(file)
imagesToPDF(files, options?)
svgToPDF(file, options?)
compressPDF(file, quality?)

// HTML service
htmlStringToPDF(html, options?)
htmlFileToPDF(file, options?)
urlToPDF(url, options?)

// Organization
organizeReorder(file, order)
organizeDuplicate(file, pages)
organizeRemove(file, pages)

// Security
protectPDF(file, userPassword, ownerPassword?)
unlockPDF(file, password)
removeMetadata(file)

// Metadata
getPDFInfo(file)
getPageCount(file)
getPagePreview(file, page?, dpi?)

// Storage
uploadTemp(file)
getFileInfo(fileId)
deleteFile(fileId)

// Utility
downloadBlob(blob, filename)
checkHealth()
```

---

## Design System

### Colors
- Brand: `#2563eb` (blue-600)
- Surface: `#ffffff`
- Background: `#f8fafc` (slate-50)
- Border: `#e2e8f0` (slate-200)

### Components

**FileDropzone** — drag-and-drop with visual feedback:
- Shows file name + size after selection
- Drag highlight with scale animation
- Keyboard accessible (Enter/Space to open browser)

**DownloadSuccess** — shown after processing:
- Green success card with file name and size
- Large "Download" button — user must click to save
- "Process another file" link to reset

**ToolLayout** — consistent wrapper for every tool page:
- Back link to homepage
- Icon + title + optional badge
- Description text

### Animations
- `animate-fade-in` — elements entering the DOM
- `animate-slide-up` — success states
- `animate-spin` — loading spinners

---

## Tools Reference

### PDF Operations (8)
| Tool | Endpoint |
|------|---------|
| Merge PDF | `POST /api/pdf/merge` |
| Split PDF | `POST /api/pdf/split` |
| Rotate PDF | `POST /api/pdf/rotate` |
| Compress PDF | `POST /api/convert/compress` |
| Watermark | `POST /api/pdf/watermark` |
| Extract Pages | `POST /api/pdf/extract` |
| Delete Pages | `POST /api/pdf/delete-pages` |
| Reorder Pages | `POST /api/pdf/reorder` |

### Convert (10)
| Tool | Endpoint |
|------|---------|
| Word to PDF | `POST /api/convert/word-to-pdf` |
| Excel to PDF | `POST /api/convert/excel-to-pdf` |
| PPT to PDF | `POST /api/convert/ppt-to-pdf` |
| PDF to Word | `POST /api/convert/pdf-to-word` |
| PDF to Text | `POST /api/convert/pdf-to-text` |
| Image to PDF | `POST /api/convert/image-to-pdf` |
| Images to PDF | `POST /api/convert/images-to-pdf` |
| PDF to Image | `POST /api/convert/pdf-to-image` |
| SVG to PDF | `POST /api/convert/svg-to-pdf` |
| HTML to PDF | `POST /api/html/string-to-pdf` + `/file-to-pdf` + `/url-to-pdf` |

### Security & Metadata (5)
| Tool | Endpoint |
|------|---------|
| Protect PDF | `POST /api/security/protect` |
| Unlock PDF | `POST /api/security/unlock` |
| Remove Metadata | `POST /api/security/remove-metadata` |
| PDF Info | `POST /api/meta/info` |
| Duplicate Pages | `POST /api/organize/duplicate` |

---

## Build

```bash
npm run build   # production build
npm run lint    # ESLint check
```

---

## Tech Stack

| | |
|--|--|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Font | Geist (next/font/google) |
| Utilities | clsx |
