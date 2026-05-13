import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { Timer } from '../utils/timer';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// REORDER — rearrange pages in a custom order
// Input: order = [3, 1, 2] → page 3 first, then 1, then 2
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const reorderPages = async (filePath: string, order: number[]): Promise<string> => {
  const t = new Timer('organize-reorder');
  logger.info('▶ organize-reorder started', { order });

  const pdfBytes = await fs.promises.readFile(filePath);
  t.step('read-file');

  const sourcePdf = await PDFDocument.load(pdfBytes);
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

  logger.info('✔ organize-reorder done', t.summary({ order, totalPages }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// DUPLICATE — duplicate specified pages (inserted right after the original)
// Input: pages = [2, 3] → page 2 appears twice, page 3 appears twice
// Typical time: 50–400 ms
// ─────────────────────────────────────────────────────────────────────────────
export const duplicatePages = async (filePath: string, pages: number[]): Promise<string> => {
  const t = new Timer('organize-duplicate');
  logger.info('▶ organize-duplicate started', { pages });

  const pdfBytes = await fs.promises.readFile(filePath);
  t.step('read-file');

  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  const invalid = pages.filter((p) => p < 1 || p > totalPages);
  if (invalid.length > 0) {
    throw Object.assign(
      new Error(`Invalid page numbers: ${invalid.join(', ')}. PDF has ${totalPages} pages.`),
      { statusCode: 400 }
    );
  }

  const toDuplicate = new Set(pages);
  const newPdf = await PDFDocument.create();

  // Walk every page; if it's in the duplicate set, copy it twice
  for (let i = 1; i <= totalPages; i++) {
    const [original] = await newPdf.copyPages(sourcePdf, [i - 1]);
    newPdf.addPage(original);

    if (toDuplicate.has(i)) {
      const [dupe] = await newPdf.copyPages(sourcePdf, [i - 1]);
      newPdf.addPage(dupe);
    }
  }
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `duplicated-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ organize-duplicate done', t.summary({ duplicated: pages.length }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE — remove specific pages from PDF
// Typical time: 50–300 ms
// ─────────────────────────────────────────────────────────────────────────────
export const removePages = async (filePath: string, pages: number[]): Promise<string> => {
  const t = new Timer('organize-remove');
  logger.info('▶ organize-remove started', { pages });

  const pdfBytes = await fs.promises.readFile(filePath);
  t.step('read-file');

  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  t.step('parse-pdf');

  const toRemove = new Set(pages);
  const toKeep = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => !toRemove.has(p)
  );

  if (toKeep.length === 0) {
    throw Object.assign(new Error('Cannot remove all pages from a PDF'), { statusCode: 400 });
  }

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(sourcePdf, toKeep.map((p) => p - 1));
  copied.forEach((p) => newPdf.addPage(p));
  t.step('copy-pages');

  const outputBytes = await newPdf.save();
  const outputPath = path.join(OUTPUT_DIR, `removed-pages-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  logger.info('✔ organize-remove done', t.summary({ removed: pages.length, kept: toKeep.length }));
  return outputPath;
};
