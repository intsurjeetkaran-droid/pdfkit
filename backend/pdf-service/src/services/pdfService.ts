import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { Timer } from '../utils/timer';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Safely load a PDF from disk.
 * Returns a 400 error (not 500) for empty or corrupt files.
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

// ─────────────────────────────────────────────────────────────────────────────
// MERGE — combine multiple PDFs into one
// Optimisation: all source PDFs are loaded in parallel with Promise.all,
// then pages are copied sequentially (pdf-lib requires sequential copyPages).
// Typical time: 100–800 ms for 2–10 files
// ─────────────────────────────────────────────────────────────────────────────
export const mergePDFs = async (filePaths: string[]): Promise<string> => {
  const t = new Timer('merge-pdf');
  logger.info('▶ merge-pdf started', { fileCount: filePaths.length });

  // Load all source PDFs in parallel — biggest win for multi-file merges
  const sourceBuffers = await Promise.all(
    filePaths.map((p) => fs.promises.readFile(p))
  );
  t.step('read-files-parallel');

  // Validate all buffers are non-empty before parsing
  for (let i = 0; i < sourceBuffers.length; i++) {
    if (sourceBuffers[i].length === 0) {
      throw Object.assign(new Error(`File ${i + 1} is empty (0 bytes)`), { statusCode: 400 });
    }
  }

  let sourceDocs: PDFDocument[];
  try {
    sourceDocs = await Promise.all(
      sourceBuffers.map((buf) => PDFDocument.load(buf))
    );
  } catch (e: any) {
    throw Object.assign(new Error(`Invalid or corrupt PDF: ${e.message}`), { statusCode: 400 });
  }
  t.step('parse-pdfs-parallel');

  const mergedPdf = await PDFDocument.create();

  // Copy pages sequentially — pdf-lib internal state requires this
  for (const doc of sourceDocs) {
    const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => mergedPdf.addPage(p));
  }
  t.step('copy-pages');

  const outputBytes = await mergedPdf.save();
  t.step('serialize');

  const outputPath = path.join(OUTPUT_DIR, `merged-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  const outputSizeKB = Math.round(outputBytes.length / 1024);
  logger.info('✔ merge-pdf done', t.summary({ outputSizeKB, outputPath }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT — extract specific pages into a new PDF
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const splitPDF = async (filePath: string, pageNumbers: number[]): Promise<string> => {
  const t = new Timer('split-pdf');
  logger.info('▶ split-pdf started', { pageNumbers });

  const sourcePdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  const validPages = pageNumbers.filter((p) => p >= 1 && p <= totalPages);
  if (validPages.length === 0) {
    throw Object.assign(
      new Error(`No valid page numbers. PDF has ${totalPages} pages.`),
      { statusCode: 400 }
    );
  }

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(sourcePdf, validPages.map((p) => p - 1));
  copied.forEach((p) => newPdf.addPage(p));
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `split-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ split-pdf done', t.summary({ pages: validPages, totalPages }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROTATE — rotate specified pages by 90 / 180 / 270 degrees
// Typical time: 50–200 ms (pure in-memory metadata change)
// ─────────────────────────────────────────────────────────────────────────────
export const rotatePDF = async (
  filePath: string,
  pageNumbers: number[], // 1-indexed; empty array = rotate all pages
  angle: 90 | 180 | 270
): Promise<string> => {
  const t = new Timer('rotate-pdf');
  logger.info('▶ rotate-pdf started', { pageNumbers, angle });

  const pdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = pdf.getPageCount();
  t.step('parse-pdf');

  // Empty array means "rotate all pages"
  const targets =
    pageNumbers.length === 0
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : pageNumbers;

  for (const num of targets) {
    if (num >= 1 && num <= totalPages) {
      const page = pdf.getPage(num - 1);
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
    }
  }
  t.step('apply-rotation');

  const outputBytes = await pdf.save();
  const outputPath = path.join(OUTPUT_DIR, `rotated-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ rotate-pdf done', t.summary({ angle, pagesRotated: targets.length }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT — extract a contiguous page range
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const extractPages = async (
  filePath: string,
  fromPage: number,
  toPage: number
): Promise<string> => {
  const t = new Timer('extract-pages');
  logger.info('▶ extract-pages started', { fromPage, toPage });

  const sourcePdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  if (fromPage < 1 || toPage > totalPages || fromPage > toPage) {
    throw Object.assign(
      new Error(`Invalid range ${fromPage}–${toPage}. PDF has ${totalPages} pages.`),
      { statusCode: 400 }
    );
  }

  const indices = Array.from({ length: toPage - fromPage + 1 }, (_, i) => fromPage - 1 + i);
  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(sourcePdf, indices);
  copied.forEach((p) => newPdf.addPage(p));
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `extracted-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ extract-pages done', t.summary({ fromPage, toPage, extracted: indices.length }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PAGES — remove specific pages
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const deletePages = async (filePath: string, pageNumbers: number[]): Promise<string> => {
  const t = new Timer('delete-pages');
  logger.info('▶ delete-pages started', { pageNumbers });

  const sourcePdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  const toDelete = new Set(pageNumbers);
  const toKeep = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => !toDelete.has(p)
  );

  if (toKeep.length === 0) {
    throw Object.assign(new Error('Cannot delete all pages from a PDF'), { statusCode: 400 });
  }

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(sourcePdf, toKeep.map((p) => p - 1));
  copied.forEach((p) => newPdf.addPage(p));
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `deleted-pages-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ delete-pages done', t.summary({ deleted: pageNumbers.length, kept: toKeep.length }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// REORDER — rearrange pages in a custom order
// Input: order = [3, 1, 2] → page 3 first, then 1, then 2
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const reorderPages = async (filePath: string, order: number[]): Promise<string> => {
  const t = new Timer('reorder-pages');
  logger.info('▶ reorder-pages started', { order });

  const sourcePdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  const invalid = order.filter((p) => p < 1 || p > totalPages);
  if (invalid.length > 0) {
    throw Object.assign(
      new Error(`Invalid page numbers: ${invalid.join(', ')}. PDF has ${totalPages} pages.`),
      { statusCode: 400 }
    );
  }

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(sourcePdf, order.map((p) => p - 1));
  copied.forEach((p) => newPdf.addPage(p));
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `reordered-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ reorder-pages done', t.summary({ order }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK — add text or image watermark
// Optimisation: font is embedded once, then reused across all pages.
// Typical time: 100–600 ms
// ─────────────────────────────────────────────────────────────────────────────
export interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  opacity?: number;   // 0.0–1.0, default 0.3
  rotation?: number;  // degrees, default 45
  pages?: number[];   // 1-indexed; empty = all pages
  fontSize?: number;  // default 48
  color?: { r: number; g: number; b: number }; // default mid-gray
}

export const watermarkPDF = async (
  filePath: string,
  options: WatermarkOptions
): Promise<string> => {
  const t = new Timer('watermark-pdf');
  logger.info('▶ watermark-pdf started', {
    hasText: !!options.text,
    hasImage: !!options.imagePath,
    opacity: options.opacity,
    rotation: options.rotation
  });

  if (!options.text && !options.imagePath) {
    throw Object.assign(
      new Error('Either text or imagePath is required for watermark'),
      { statusCode: 400 }
    );
  }

  const pdf = await loadPDF(filePath);
  t.step('read-file + parse-pdf');
  const totalPages = pdf.getPageCount();
  t.step('parse-pdf');

  const opacity  = options.opacity  ?? 0.3;
  const rotation = options.rotation ?? 45;
  const fontSize = options.fontSize ?? 48;
  const color    = options.color    ?? { r: 0.5, g: 0.5, b: 0.5 };

  const targetIndices =
    !options.pages || options.pages.length === 0
      ? Array.from({ length: totalPages }, (_, i) => i)
      : options.pages.filter((p) => p >= 1 && p <= totalPages).map((p) => p - 1);

  if (options.text) {
    // Embed font once — reused for every page (avoids repeated embed overhead)
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    t.step('embed-font');

    const textWidth = font.widthOfTextAtSize(options.text, fontSize);

    for (const idx of targetIndices) {
      const page = pdf.getPage(idx);
      const { width, height } = page.getSize();
      page.drawText(options.text, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotation)
      });
    }
    t.step('draw-text-watermark');

  } else if (options.imagePath && fs.existsSync(options.imagePath)) {
    const imageBytes = await fs.promises.readFile(options.imagePath);
    const ext = path.extname(options.imagePath).toLowerCase();

    // Embed image once — reused for every page
    const embeddedImage =
      ext === '.png'
        ? await pdf.embedPng(imageBytes)
        : await pdf.embedJpg(imageBytes);
    t.step('embed-image');

    const imgDims = embeddedImage.scale(0.5);

    for (const idx of targetIndices) {
      const page = pdf.getPage(idx);
      const { width, height } = page.getSize();
      page.drawImage(embeddedImage, {
        x: (width - imgDims.width) / 2,
        y: (height - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
        opacity,
        rotate: degrees(rotation)
      });
    }
    t.step('draw-image-watermark');
  }

  const outputBytes = await pdf.save();
  const outputPath = path.join(OUTPUT_DIR, `watermarked-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ watermark-pdf done', t.summary({ pagesWatermarked: targetIndices.length }));
  return outputPath;
};

