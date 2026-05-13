import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execCommand } from '../utils/exec';
import { Timer } from '../utils/timer';
import logger from '../logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Safely load a PDF — returns 400 for corrupt/empty files.
 */
async function loadPDF(filePath: string): Promise<PDFDocument> {
  const buf = await fs.promises.readFile(filePath);
  if (buf.length === 0) {
    throw Object.assign(new Error('File is empty (0 bytes)'), { statusCode: 400 });
  }
  try {
    return await PDFDocument.load(buf);
  } catch (e: any) {
    throw Object.assign(
      new Error(`Invalid or corrupt PDF: ${e.message}`),
      { statusCode: 400 }
    );
  }
}

/**
 * Read the PDF version string directly from the file header.
 * The PDF spec requires the first line to be: %PDF-x.y
 * This is more reliable than using pdf-lib's producer field.
 *
 * Returns e.g. "1.4", "1.7", "2.0" or null if not found.
 */
function readPDFVersion(filePath: string): string | null {
  try {
    // Read only the first 20 bytes — the header is always at the start
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(20);
    fs.readSync(fd, buf, 0, 20, 0);
    fs.closeSync(fd);

    const header = buf.toString('ascii');
    // Match %PDF-x.y at the start of the file
    const match = header.match(/%PDF-(\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO — extract full metadata from a PDF using pdf-lib
//
// Returns: page count, per-page dimensions (pt + mm), file size,
//          PDF version (from file header), document info fields
//          (title, author, subject, keywords, creator, producer),
//          creation/modification dates, encryption status.
//
// Pure in-process operation — no external tools needed.
// Typical time: 50–300ms
// ─────────────────────────────────────────────────────────────────────────────
export const extractInfo = async (filePath: string) => {
  const t = new Timer('extract-info');
  const fileSizeBytes = fs.statSync(filePath).size;
  logger.info('▶ extract-info started', { fileSizeKB: Math.round(fileSizeBytes / 1024) });

  // Read PDF version from file header before loading (fast, no parsing needed)
  const pdfVersion = readPDFVersion(filePath);
  t.step('read-version');

  const pdf = await loadPDF(filePath);
  t.step('load-pdf');

  // Wrap page operations — some corrupt PDFs pass load() but crash on getPageCount()
  let pageCount: number;
  let pages: Array<{page: number; widthPt: number; heightPt: number; widthMm: number; heightMm: number; rotation: number}>;

  try {
    pageCount = pdf.getPageCount();

    // Per-page dimensions (width × height in PDF points, 1pt = 1/72 inch)
    pages = Array.from({ length: pageCount }, (_, i) => {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();
      const rotation = page.getRotation().angle;
      return {
        page:     i + 1,
        widthPt:  Math.round(width),
        heightPt: Math.round(height),
        widthMm:  Math.round((width  / 72) * 25.4),
        heightMm: Math.round((height / 72) * 25.4),
        rotation
      };
    });
  } catch (e: any) {
    throw Object.assign(
      new Error(`Invalid or corrupt PDF: ${e.message}`),
      { statusCode: 400 }
    );
  }
  t.step('read-pages');

  // Document info fields — null when not set in the PDF
  const info = {
    pageCount,
    fileSizeBytes,
    fileSizeKB:   Math.round(fileSizeBytes / 1024),
    // FIX: use 3 decimal places so small files show e.g. 0.001 instead of 0
    fileSizeMB:   parseFloat((fileSizeBytes / (1024 * 1024)).toFixed(3)),
    // FIX: read version from file header (%PDF-x.y), not from producer field
    pdfVersion:   pdfVersion,
    title:        pdf.getTitle()        || null,
    author:       pdf.getAuthor()       || null,
    subject:      pdf.getSubject()      || null,
    keywords:     pdf.getKeywords()     || null,
    creator:      pdf.getCreator()      || null,
    producer:     pdf.getProducer()     || null,
    creationDate: pdf.getCreationDate()     ? pdf.getCreationDate()!.toISOString()     : null,
    modDate:      pdf.getModificationDate() ? pdf.getModificationDate()!.toISOString() : null,
    // pdf-lib can only open unencrypted PDFs — if we got here, it's not encrypted
    isEncrypted:  false,
    pages
  };
  t.step('extract-fields');

  logger.info('✔ extract-info done', t.summary({ pageCount, pdfVersion }));
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COUNT — fast endpoint, returns only the page count
//
// Useful for frontend to know how many pages before showing a reorder/preview UI.
// Typical time: 30–150ms
// ─────────────────────────────────────────────────────────────────────────────
export const getPageCount = async (filePath: string): Promise<number> => {
  const t = new Timer('page-count');
  logger.info('▶ page-count started');

  const pdf = await loadPDF(filePath);
  t.step('load-pdf');

  const count = pdf.getPageCount();
  logger.info('✔ page-count done', t.summary({ pageCount: count }));
  return count;
};

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW — generate a PNG thumbnail of a specific page using pdftoppm
//
// Uses poppler-utils (pdftoppm) to render the page at low DPI (96 by default).
// Returns the path to the generated PNG file.
//
// Typical time: 500ms – 3s depending on page complexity
// ─────────────────────────────────────────────────────────────────────────────
export const generatePreview = async (
  filePath: string,
  page: number = 1,   // 1-indexed
  dpi: number  = 96   // low DPI for thumbnails
): Promise<string> => {
  const t = new Timer('generate-preview');
  logger.info('▶ generate-preview started', { page, dpi });

  // Validate page number first using pdf-lib (fast, no external tool needed)
  const pdf = await loadPDF(filePath);
  const totalPages = pdf.getPageCount();
  t.step('load-pdf');

  if (page < 1 || page > totalPages) {
    throw Object.assign(
      new Error(`Invalid page ${page}. PDF has ${totalPages} pages.`),
      { statusCode: 400 }
    );
  }

  // Clamp DPI to reasonable range for thumbnails
  const safeDpi = Math.min(Math.max(dpi, 36), 150);

  // pdftoppm generates: <prefix>-<zero-padded-page>.png
  // -f and -l specify first and last page (1-indexed)
  const outputPrefix = path.join(OUTPUT_DIR, `preview-${uuidv4()}`);
  const command = [
    'pdftoppm',
    '-png',
    `-r ${safeDpi}`,
    `-f ${page}`,
    `-l ${page}`,
    `"${filePath}"`,
    `"${outputPrefix}"`
  ].join(' ');

  await execCommand(command);
  t.step('pdftoppm-exec');

  // Find the generated file — pdftoppm names it: <prefix>-<zero-padded-page>.png
  const dir   = path.dirname(outputPrefix);
  const base  = path.basename(outputPrefix);
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(base));

  if (files.length === 0) {
    throw new Error('pdftoppm did not produce a preview image');
  }

  const previewPath = path.join(dir, files[0]);
  t.step('find-output');

  logger.info('✔ generate-preview done', t.summary({ page, dpi: safeDpi, previewPath }));
  return previewPath;
};
