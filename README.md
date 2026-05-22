# PDFKit

**Guest-First PDF Utility Platform — No Signup Required**
**Version:** 3.2.0 | **Status:** ✅ Production Ready | **Services:** 9 microservices | **Operations:** 39 backend / 23 frontend tools

> Upload a file, process it, download the result. Files auto-delete after 1 hour. No account needed.

---

## What's New in v3.2.0

- **Landing page** — full redesign split into 10 section components (`sections/`), sticky nav with anchor links, infinite marquee tool carousel, auto-sliding how-it-works carousel
- **Tools page** — premium redesign with gradient header, category accent bars, hover arrow reveal on cards
- **Interactive PDF tools** — Delete Pages, Reorder (drag-and-drop), Split, and Duplicate now show visual page thumbnails instead of text input fields
- **`PdfPageGrid` component** — shared visual page grid with click-to-mark, drag-to-reorder, and click-to-select modes
- **Logo** — custom SVG logo (file + star) implemented across Header, Footer, and landing nav
- **Footer** — 4-column layout (PDF Tools, Convert, Security, Company) with slide-in underline hover effect on all links
- **6 company pages** — About, Privacy, Terms, Contact, Cookies, DMCA — all content-accurate, no tech stack leaks
- **FileDropzone** — larger upload area (260px min-height), prominent Upload icon, "Choose file" button hint
- **ToolLayout** — header card with larger icon (h-14 w-14), auto-scales child icon size
- **Viewport fill** — tool pages fill the full viewport so footer is always below the fold
- **"20+" everywhere** — consistent tool count across landing, tools page, and all CTAs

---

## Quick Start

### Local Development (Docker Compose)

```bash
cd backend
docker-compose up --build -d

# All 12 containers start: 9 services + MySQL + Redis + MinIO
docker-compose ps

# Run tests
node tests/run.js
```

| URL | What |
|-----|------|
| http://localhost:3000 | API Gateway (all requests go here) |
| http://localhost:3004 | Next.js Frontend |
| http://localhost:3006/admin/queues | Bull Board — queue dashboard |
| http://localhost:9001 | MinIO Console (minioadmin / minioadmin) |

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev
```

### Kubernetes (Production)

```bash
# Install prerequisites
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace

# Deploy everything
cd backend/k8s
chmod +x deploy.sh && ./deploy.sh

# Watch auto-scaling in action
kubectl get hpa -n pdfkit -w
```

See [`deployment/`](./deployment/) for the full Oracle Cloud step-by-step guide.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Next.js Frontend :3004                       │
│   23 tools · Mobile-first · No auth · Manual download        │
└─────────────────────────┬────────────────────────────────────┘
                          │
                   ┌──────▼─────────────────────────────────┐
                   │         API Gateway :3000               │
                   │  Proxy · Rate limiting · CORS · Tracing │
                   └──────┬─────────────────────────────────┘
                          │
  ┌──────┬──────┬──────┬──┴───┬──────┬──────┬──────┬──────┐
  ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
:3001  :3002  :3003  :3006  :3007  :3008  :3009  :3010
 PDF  Convert Storage Queue   Org  Security Meta  HTML

Infrastructure:
  MySQL  :3307  — file metadata        (storage-service)
  Redis  :6380  — BullMQ + rate limits (queue-service)
  MinIO  :9000  — shared file storage  (ALL services — enables K8s scaling)
```

**Kubernetes production** adds HPA auto-scaling per service and Nginx Ingress for TLS:

```
Internet → Nginx Ingress → api-gateway (2–10 pods)
                         → pdf-service       (2–10 pods)
                         → conversion-service (2–8 pods)
                         → html-service       (2–6 pods)
                         → ... (all 9 services scale independently)
```

---

## All 39 Operations

Full details with inputs, outputs, and timing in [`services.txt`](./services.txt).

### PDF Manipulation — `/api/pdf/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 1 | `POST /api/pdf/merge` | Combine 2–20 PDFs into one |
| 2 | `POST /api/pdf/split` | Extract specific pages |
| 3 | `POST /api/pdf/rotate` | Rotate pages 90/180/270° |
| 4 | `POST /api/pdf/extract` | Extract a page range |
| 5 | `POST /api/pdf/delete-pages` | Remove specific pages |
| 6 | `POST /api/pdf/reorder` | Rearrange pages in custom order |
| 7 | `POST /api/pdf/watermark` | Add text or image watermark |

### File Conversion — `/api/convert/*`
| # | Endpoint | What it does | Tool |
|---|----------|-------------|------|
| 8 | `POST /api/convert/word-to-pdf` | DOCX/DOC → PDF | LibreOffice |
| 9 | `POST /api/convert/excel-to-pdf` | XLSX/XLS → PDF | LibreOffice |
| 10 | `POST /api/convert/ppt-to-pdf` | PPTX/PPT → PDF | LibreOffice |
| 11 | `POST /api/convert/pdf-to-image` | PDF → PNG/JPG per page | pdftoppm |
| 12 | `POST /api/convert/image-to-pdf` | Single image → PDF | sharp + pdf-lib |
| 13 | `POST /api/convert/compress` | Reduce PDF file size | Ghostscript |
| 14 | `POST /api/convert/pdf-to-word` | PDF → DOCX | LibreOffice |
| 15 | `POST /api/convert/pdf-to-text` | Extract all text | pdftotext |
| 16 | `POST /api/convert/svg-to-pdf` | SVG → PDF | sharp + pdf-lib |
| 17 | `POST /api/convert/images-to-pdf` | Up to 50 images → PDF | sharp + pdf-lib |

### Page Organization — `/api/organize/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 18 | `POST /api/organize/reorder` | Rearrange pages |
| 19 | `POST /api/organize/duplicate` | Duplicate specific pages |
| 20 | `POST /api/organize/remove` | Remove specific pages |

### PDF Security — `/api/security/*`
| # | Endpoint | What it does | Tool |
|---|----------|-------------|------|
| 21 | `POST /api/security/protect` | Add AES-256 password | qpdf |
| 22 | `POST /api/security/unlock` | Remove password | qpdf |
| 23 | `POST /api/security/remove-metadata` | Strip title/author/dates/XMP | pdf-lib |

### Metadata & Inspection — `/api/meta/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 24 | `POST /api/meta/info` | Full metadata (pages, dimensions, author, dates) |
| 25 | `POST /api/meta/page-count` | Fast page count |
| 26 | `POST /api/meta/preview` | PNG thumbnail of any page |

### HTML to PDF — `/api/html/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 27 | `POST /api/html/file-to-pdf` | HTML file → PDF |
| 28 | `POST /api/html/url-to-pdf` | Navigate URL → PDF |
| 29 | `POST /api/html/string-to-pdf` | Raw HTML string → PDF |

### File Storage — `/api/storage/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 30 | `POST /api/storage/upload-temp` | Upload file (1-hour TTL, returns fileId + downloadUrl) |
| 31 | `GET /api/storage/temp/:id` | Get file metadata |
| 32 | `GET /api/storage/temp/:id/download` | Stream download |
| 33 | `DELETE /api/storage/temp/:id` | Delete file |
| 34 | `GET /api/storage/stats` | Storage usage stats |
| 35 | `POST /api/storage/cleanup` | Trigger expired file cleanup |

### Job Queue — `/api/queue/*`
| # | Endpoint | What it does |
|---|----------|-------------|
| 36 | `POST /api/queue/jobs` | Add async job to queue |
| 37 | `GET /api/queue/jobs/:queue/:id` | Poll job status |
| 38 | `GET /api/queue/stats` | All queue counts |
| 39 | `POST /api/queue/jobs/:queue/:id/retry` | Retry failed job |

---

## curl Examples

```bash
# Merge PDFs
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" -F "files=@file2.pdf" -o merged.pdf

# Compress PDF
curl -X POST http://localhost:3000/api/convert/compress \
  -F "file=@large.pdf" -F "quality=ebook" -o compressed.pdf

# Word to PDF
curl -X POST http://localhost:3000/api/convert/word-to-pdf \
  -F "file=@document.docx" -o output.pdf

# PDF to Text
curl -X POST http://localhost:3000/api/convert/pdf-to-text \
  -F "file=@document.pdf" -o extracted.txt

# Multiple images to PDF
curl -X POST http://localhost:3000/api/convert/images-to-pdf \
  -F "files=@img1.png" -F "files=@img2.jpg" -F "pageSize=A4" -o combined.pdf

# HTML string to PDF
curl -X POST http://localhost:3000/api/html/string-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Invoice</h1>","format":"A4"}' -o invoice.pdf

# URL to PDF
curl -X POST http://localhost:3000/api/html/url-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' -o page.pdf

# Protect with password
curl -X POST http://localhost:3000/api/security/protect \
  -F "file=@document.pdf" -F "userPassword=secret123" -o protected.pdf

# Upload for 1-hour sharing
curl -X POST http://localhost:3000/api/storage/upload-temp \
  -F "file=@document.pdf"
# Returns: { fileId, downloadUrl, expiresAt }
```

---

## Project Structure

```
pdfkit/
├── backend/
│   ├── api-gateway/           :3000  single entry point, pure proxy
│   ├── pdf-service/           :3001  7 PDF operations (pdf-lib)
│   ├── conversion-service/    :3002  10 conversions
│   ├── storage-service/       :3003  upload/download/TTL (MySQL + MinIO)
│   ├── queue-service/         :3006  BullMQ 8 queues + Bull Board UI
│   ├── organization-service/  :3007  reorder/duplicate/remove (pdf-lib)
│   ├── security-service/      :3008  protect/unlock/strip-metadata (qpdf)
│   ├── metadata-service/      :3009  info/page-count/preview
│   ├── html-service/          :3010  html/url/string → pdf (Chromium)
│   ├── shared/
│   │   ├── logger/            global logger factory (pod-aware, JSON in prod)
│   │   └── utils/
│   │       ├── minioClient.ts shared MinIO client
│   │       └── timer.ts       per-step timing utility
│   ├── k8s/                   Kubernetes manifests (all 9 services + infra)
│   ├── docs/                  full API and service documentation
│   ├── tests/                 342 tests across 9 suites
│   └── docker-compose.yml     12 containers (9 services + MySQL + Redis + MinIO)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx               → redirects to landing page
│       │   ├── landing/               Landing page (/)
│       │   │   ├── page.tsx           wrapper — imports all sections
│       │   │   └── sections/          one file per section
│       │   │       ├── NavSection.tsx         sticky nav + mobile menu
│       │   │       ├── HeroSection.tsx        dark hero + CTAs + tool pills
│       │   │       ├── StatsSection.tsx       4 stat cards
│       │   │       ├── WhySection.tsx         6 feature cards
│       │   │       ├── CompareSection.tsx     comparison table
│       │   │       ├── HowItWorksSection.tsx  auto-sliding 3-step carousel
│       │   │       ├── ToolsHighlightSection.tsx  infinite marquee
│       │   │       ├── TrustSection.tsx       4 privacy cards
│       │   │       ├── CtaSection.tsx         final CTA banner
│       │   │       └── FooterSection.tsx      4-column footer
│       │   └── (main)/                Pages with shared Header + Footer
│       │       ├── layout.tsx         Header + Footer + min-h viewport fill
│       │       ├── tools/
│       │       │   ├── page.tsx       tools grid — premium card design
│       │       │   ├── merge/         Merge PDF
│       │       │   ├── split/         Split PDF — visual page grid
│       │       │   ├── rotate/        Rotate PDF
│       │       │   ├── compress/      Compress PDF
│       │       │   ├── watermark/     Watermark PDF
│       │       │   ├── extract/       Extract Pages
│       │       │   ├── delete-pages/  Delete Pages — visual page grid + X buttons
│       │       │   ├── reorder/       Reorder Pages — drag-and-drop grid
│       │       │   ├── duplicate/     Duplicate Pages — click-to-select grid
│       │       │   ├── word-to-pdf/   Word → PDF
│       │       │   ├── excel-to-pdf/  Excel → PDF
│       │       │   ├── ppt-to-pdf/    PPT → PDF
│       │       │   ├── pdf-to-word/   PDF → Word
│       │       │   ├── pdf-to-text/   PDF → Text
│       │       │   ├── image-to-pdf/  Image → PDF
│       │       │   ├── images-to-pdf/ Multiple images → PDF
│       │       │   ├── pdf-to-image/  PDF → Images
│       │       │   ├── svg-to-pdf/    SVG → PDF
│       │       │   ├── html-to-pdf/   HTML/URL/string → PDF
│       │       │   ├── protect/       Protect PDF
│       │       │   ├── unlock/        Unlock PDF
│       │       │   ├── remove-metadata/ Remove Metadata
│       │       │   └── pdf-info/      PDF Info
│       │       ├── about/             About Us
│       │       ├── privacy/           Privacy Policy
│       │       ├── terms/             Terms of Service
│       │       ├── contact/           Contact Us
│       │       ├── cookies/           Cookie Policy
│       │       └── dmca/              DMCA & Copyright
│       └── components/
│           ├── Logo.tsx               Custom SVG logo (file + star icon)
│           ├── PdfPageGrid.tsx        Interactive page grid (delete/reorder/duplicate)
│           ├── FileDropzone.tsx       Large upload area with prominent icon
│           ├── ToolLayout.tsx         Tool page wrapper with header card
│           ├── Header.tsx             Sticky nav with dropdown menus
│           ├── Footer.tsx             4-column footer with hover underline links
│           └── ...                    other shared components
│
├── deployment/                Oracle Cloud Always Free deployment guide (12 files)
└── services.txt               39 backend API operations, category-wise
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5.3 |
| Framework | Express 4.18 |
| PDF manipulation | pdf-lib 1.17 |
| Image processing | sharp 0.33 |
| Office conversion | LibreOffice (headless) |
| PDF compression | Ghostscript |
| PDF → Image / Text | pdftoppm, pdftotext (poppler-utils) |
| HTML → PDF | Puppeteer-core + Chromium |
| PDF security | qpdf |
| Queue | BullMQ 5 + Redis 7 |
| Database | MySQL 8 + Prisma 5.8 |
| Object Storage | MinIO (S3-compatible) |
| Logging | Winston 3.11 — pod-aware, per-step timing |
| Containers | Docker + Docker Compose |
| Orchestration | Kubernetes + HPA auto-scaling |
| Ingress | Nginx Ingress Controller |
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 |

---

## Deployment — Oracle Cloud Always Free

Deploy the entire platform for **$0 forever** on Oracle Cloud's Always Free tier.

**What you get free:**
- 4 OCPUs + 24 GB RAM (ARM Ampere A1 Flex)
- 200 GB block storage
- 10 TB outbound data/month

**Estimated capacity on free tier:** 100–200 concurrent users

```bash
# Full guide in deployment/ folder
# Start here:
cat deployment/00-INDEX.txt
```

| File | Contents |
|------|---------|
| `01-oracle-account-setup.txt` | Create OCI account, provision ARM VM, open firewall |
| `02-server-initial-setup.txt` | SSH, Docker, Nginx, swap, iptables |
| `03-project-deploy.txt` | Clone, configure, run, verify |
| `04-nginx-ssl.txt` | Reverse proxy + free Let's Encrypt SSL |
| `05-domain-setup.txt` | Free and paid domain options, Cloudflare CDN |
| `06-monitoring.txt` | Logs, health checks, Bull Board, disk alerts |
| `07-managing.txt` | Update code, backup MySQL, scale services |
| `08-troubleshooting.txt` | Common problems with exact fixes |
| `09-oracle-cloud-console.txt` | OCI metrics, alarms, snapshots, cost check |
| `10-security-hardening.txt` | Passwords, CORS, fail2ban, SSH |
| `11-performance-tuning.txt` | Docker limits, MySQL tuning, log rotation |
| `12-quick-reference.txt` | All daily commands on one page |

---

## Kubernetes HPA Scaling

| Service | Min Pods | Max Pods | CPU Threshold |
|---------|----------|----------|---------------|
| api-gateway | 2 | 10 | 70% |
| pdf-service | 2 | 10 | 70% |
| conversion-service | 2 | 8 | 65% (LibreOffice heavy) |
| html-service | 2 | 6 | 65% (Chromium heavy) |
| storage-service | 2 | 8 | 70% |
| queue-service | 2 | 4 | 70% |
| organization-service | 2 | 8 | 70% |
| security-service | 2 | 8 | 70% |
| metadata-service | 2 | 8 | 70% |

---

## Rate Limits

| Limit | Value | Applies to |
|-------|-------|-----------|
| Standard | 100 req / 15 min / IP | All routes |
| Heavy ops | 20 req / hour / IP | compress, pdf-to-word, all `/api/html/*` |
| Max file size | 100 MB | All uploads |
| File TTL | 1 hour | All guest uploads (auto-deleted) |

`TEST_MODE=true` raises all limits to 10,000 for automated testing.

---

## Logging

Every service logs structured JSON with:

```json
{
  "timestamp": "2026-05-22T06:30:15.432Z",
  "level": "info",
  "service": "pdf-service",
  "pod": "pdf-service-abc123",
  "message": "✔ merge-pdf done",
  "totalMs": 312,
  "steps": [
    { "step": "read-files-parallel", "ms": 45 },
    { "step": "parse-pdfs-parallel", "ms": 180 },
    { "step": "copy-pages", "ms": 72 },
    { "step": "write-file", "ms": 15 }
  ]
}
```

In Kubernetes, `pod` is set via the Downward API (`POD_NAME` env var) so you can trace any request to the exact pod that handled it.

---

## Testing

```bash
cd backend

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

---

## Documentation

| Doc | Location |
|-----|---------|
| All 39 operations (category-wise) | [`services.txt`](./services.txt) |
| Oracle Cloud deployment guide | [`deployment/`](./deployment/) |
| Backend README | [`backend/README.md`](./backend/README.md) |
| Kubernetes guide | [`backend/docs/KUBERNETES.md`](./backend/docs/KUBERNETES.md) |
| API Reference | [`backend/docs/API-REFERENCE.md`](./backend/docs/API-REFERENCE.md) |
| Frontend Integration | [`backend/docs/FRONTEND-INTEGRATION.md`](./backend/docs/FRONTEND-INTEGRATION.md) |
| Getting Started | [`backend/docs/GETTING_STARTED.md`](./backend/docs/GETTING_STARTED.md) |
| Error Handling | [`backend/docs/ERROR-HANDLING.md`](./backend/docs/ERROR-HANDLING.md) |

---

## Changelog

### v3.2.0 — May 2026
- Landing page split into 10 section components under `landing/sections/`
- Landing nav with section anchor links + mobile hamburger menu
- How-it-works section: auto-sliding carousel (3s interval, progress bar, click tabs)
- Popular tools section: infinite horizontal marquee with pause-on-hover
- Tools page: premium redesign — gradient header banner, category accent bars, hover arrow reveal
- Interactive PDF tools: Delete Pages (X buttons), Reorder (drag-and-drop), Split (click-to-select), Duplicate (click-to-select) — all use visual page thumbnails via `PdfPageGrid` component
- Custom SVG Logo component (file + star) — Header, Footer, landing nav
- Footer: 4-column layout with slide-in underline hover effect on all links
- FileDropzone: larger (260px), prominent Upload icon, "Choose file" button
- ToolLayout: header card, larger icon container (h-14 w-14), auto-scales child icons
- Viewport fill: tool pages always push footer below the fold
- 6 company pages: About, Privacy, Terms, Contact, Cookies, DMCA — content-accurate
- Consistent "20+" tool count across all pages and CTAs
- Removed competitor name references from comparison section
- Removed tech stack disclosures from public-facing pages

### v3.1.0 — May 2026
- Kubernetes manifests for all 9 services (Deployments, Services, HPAs, Ingress)
- MinIO shared object storage — enables stateless horizontal scaling
- Updated docker-compose with MinIO (dev/prod parity)
- Pod-aware global logging across all services (POD_NAME, JSON format in prod)
- Oracle Cloud Always Free deployment guide (12 files in `deployment/`)
- `services.txt` — complete 39-operation directory at project root

### v3.0.0 — May 2026
- Added `html-service` (port 3010) — HTML/URL/string → PDF via Chromium
- Added `pdf-to-text`, `svg-to-pdf`, `images-to-pdf` to conversion-service
- Frontend: 23 tool pages, mobile-first, manual download UX
- 342/342 tests passing

### v2.0.0 — May 2026
- Removed auth-service and user-service (guest-first architecture)
- Added organization-service, security-service, metadata-service
- Upload limit 20 MB → 100 MB, 1-hour TTL auto-cleanup
- Per-step timing logs on every operation
