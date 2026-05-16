import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  officeToPdf,
  pdfToImage,
  imageToPdf,
  compressPdf,
  pdfToWord,
  pdfToText,
  svgToPdf,
  imagesToPdf
} from '../services/conversionService';
import logger from '../logger';
import { Timer } from '../utils/timer';

// ── MIME type sets for per-route validation ───────────────────────────────────
const PDF_MIMES    = new Set(['application/pdf']);
const IMAGE_MIMES  = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff', 'image/bmp']);
const SVG_MIMES    = new Set(['image/svg+xml']);
const OFFICE_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
]);

/** Reject file if MIME doesn't match expected set. Deletes temp file. */
function validateMime(
  file: Express.Multer.File,
  allowed: Set<string>,
  label: string,
  res: Response
): boolean {
  if (!allowed.has(file.mimetype)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({
      success: false,
      message: `Expected ${label} file, got: ${file.mimetype}`
    });
    return false;
  }
  return true;
}

/** Reject zero-byte files. Deletes temp file. */
function validateNotEmpty(file: Express.Multer.File, res: Response): boolean {
  if (file.size === 0) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ success: false, message: 'File is empty (0 bytes)' });
    return false;
  }
  return true;
}

// ── Stream helper ─────────────────────────────────────────────────────────────
const sendFileAndCleanup = (
  res: Response,
  filePath: string,
  downloadName: string,
  mimeType: string
): void => {
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.setHeader('Content-Type', mimeType);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('close', () => fs.unlink(filePath, () => {}));
  stream.on('error', (err) => {
    logger.error('Stream error while sending file', { filePath, error: err.message });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'File download failed' });
  });
};

// ── POST /api/convert/word-to-pdf ─────────────────────────────────────────────
// ── POST /api/convert/excel-to-pdf ───────────────────────────────────────────
// ── POST /api/convert/ppt-to-pdf ─────────────────────────────────────────────
export const officeToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-office-to-pdf');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'File is required' }); return; }
    if (!validateMime(file, OFFICE_MIMES, 'Office document (DOCX/XLSX/PPTX)', res)) return;
    if (!validateNotEmpty(file, res)) return;

    logger.info('Request: office-to-pdf', { originalName: file.originalname, mimeType: file.mimetype, sizeKB: Math.round(file.size / 1024) });

    const outputPath = await officeToPdf(file.path);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    logger.info('Response: office-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'converted.pdf', 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/convert/pdf-to-image ───────────────────────────────────────────
export const pdfToImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-pdf-to-image');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }
    if (!validateMime(file, PDF_MIMES, 'PDF', res)) return;
    if (!validateNotEmpty(file, res)) return;

    const format = (req.body.format === 'jpg' ? 'jpg' : 'png') as 'png' | 'jpg';
    const dpi    = Math.min(Math.max(parseInt(req.body.dpi) || 150, 72), 300);

    logger.info('Request: pdf-to-image', { originalName: file.originalname, sizeKB: Math.round(file.size / 1024), format, dpi });

    const imagePaths = await pdfToImage(file.path, format, dpi);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    if (imagePaths.length === 1) {
      logger.info('Response: pdf-to-image (single page)', t.summary());
      sendFileAndCleanup(res, imagePaths[0], `page-1.${format}`, `image/${format}`);
    } else {
      logger.info('Response: pdf-to-image (multi-page)', t.summary({ pageCount: imagePaths.length }));
      res.json({
        success: true,
        message: `PDF converted to ${imagePaths.length} images`,
        data: { pageCount: imagePaths.length, format, dpi, files: imagePaths.map((p, i) => ({ page: i + 1, filename: path.basename(p) })) }
      });
    }
  } catch (error) { next(error); }
};

// ── POST /api/convert/image-to-pdf ───────────────────────────────────────────
export const imageToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-image-to-pdf');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'Image file is required' }); return; }
    if (!validateMime(file, IMAGE_MIMES, 'image (PNG/JPEG/WebP/TIFF/BMP)', res)) return;
    if (!validateNotEmpty(file, res)) return;

    logger.info('Request: image-to-pdf', { originalName: file.originalname, mimeType: file.mimetype, sizeKB: Math.round(file.size / 1024) });

    const outputPath = await imageToPdf(file.path);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    logger.info('Response: image-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'converted.pdf', 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/convert/compress ───────────────────────────────────────────────
export const compressPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-compress-pdf');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }
    if (!validateMime(file, PDF_MIMES, 'PDF', res)) return;
    if (!validateNotEmpty(file, res)) return;

    const validQualities = ['screen', 'ebook', 'printer', 'prepress'] as const;
    const quality = validQualities.includes(req.body.quality) ? req.body.quality : 'ebook';

    logger.info('Request: compress-pdf', { originalName: file.originalname, sizeKB: Math.round(file.size / 1024), quality });

    const outputPath = await compressPdf(file.path, quality);
    t.step('compression');
    fs.unlink(file.path, () => {});

    logger.info('Response: compress-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'compressed.pdf', 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/convert/pdf-to-word ────────────────────────────────────────────
export const pdfToWordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-pdf-to-word');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }
    if (!validateMime(file, PDF_MIMES, 'PDF', res)) return;
    if (!validateNotEmpty(file, res)) return;

    logger.info('Request: pdf-to-word', { originalName: file.originalname, sizeKB: Math.round(file.size / 1024) });

    const outputPath = await pdfToWord(file.path);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    logger.info('Response: pdf-to-word', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'converted.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  } catch (error) { next(error); }
};

// ── POST /api/convert/pdf-to-text ─────────────────────────────────────────────
export const pdfToTextHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-pdf-to-text');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }
    if (!validateMime(file, PDF_MIMES, 'PDF', res)) return;
    if (!validateNotEmpty(file, res)) return;

    logger.info('Request: pdf-to-text', { originalName: file.originalname, sizeKB: Math.round(file.size / 1024) });

    const { outputPath, text, pageCount } = await pdfToText(file.path);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    logger.info('Response: pdf-to-text', t.summary({ outputPath, pageCount, textLength: text.length }));
    sendFileAndCleanup(res, outputPath, `${path.basename(file.originalname, '.pdf')}.txt`, 'text/plain; charset=utf-8');
  } catch (error) { next(error); }
};

// ── POST /api/convert/svg-to-pdf ──────────────────────────────────────────────
export const svgToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-svg-to-pdf');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'SVG file is required' }); return; }
    if (!validateMime(file, SVG_MIMES, 'SVG', res)) return;
    if (!validateNotEmpty(file, res)) return;

    const pageSize    = (['A4', 'Letter', 'auto'] as const).includes(req.body.pageSize) ? req.body.pageSize : 'A4';
    const orientation = req.body.orientation === 'landscape' ? 'landscape' : 'portrait';

    logger.info('Request: svg-to-pdf', { originalName: file.originalname, sizeKB: Math.round(file.size / 1024), pageSize, orientation });

    const outputPath = await svgToPdf(file.path, { pageSize, orientation });
    t.step('conversion');
    fs.unlink(file.path, () => {});

    logger.info('Response: svg-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, `${path.basename(file.originalname, '.svg')}.pdf`, 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/convert/images-to-pdf ──────────────────────────────────────────
export const imagesToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-images-to-pdf');
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) { res.status(400).json({ success: false, message: 'At least one image file is required' }); return; }
    if (files.length > 50) { res.status(400).json({ success: false, message: 'Maximum 50 images per request' }); return; }

    // Validate all files are images
    for (const file of files) {
      if (!IMAGE_MIMES.has(file.mimetype)) {
        files.forEach((f) => fs.unlink(f.path, () => {}));
        res.status(400).json({ success: false, message: `Expected image file, got: ${file.mimetype}` });
        return;
      }
      if (file.size === 0) {
        files.forEach((f) => fs.unlink(f.path, () => {}));
        res.status(400).json({ success: false, message: 'One or more files are empty (0 bytes)' });
        return;
      }
    }

    // Parse options
    const pageSize    = (['A4', 'Letter', 'auto'] as const).includes(req.body.pageSize) ? req.body.pageSize : 'A4';
    const orientation = req.body.orientation === 'landscape' ? 'landscape' : 'portrait';
    const margin      = Math.min(Math.max(parseInt(req.body.margin) || 0, 0), 100);
    const fit         = (['contain', 'cover', 'stretch'] as const).includes(req.body.fit) ? req.body.fit : 'contain';

    // Respect custom order if provided
    let orderedPaths = files.map((f) => f.path);
    if (req.body.order) {
      try {
        const order: number[] = JSON.parse(req.body.order);
        if (Array.isArray(order) && order.length === files.length) {
          orderedPaths = order.map((i) => files[i]?.path).filter(Boolean) as string[];
        }
      } catch { /* ignore invalid order, use original */ }
    }

    logger.info('Request: images-to-pdf', { count: files.length, pageSize, orientation, margin, fit });

    const outputPath = await imagesToPdf(orderedPaths, { pageSize, orientation, margin, fit });
    t.step('conversion');
    files.forEach((f) => fs.unlink(f.path, () => {}));

    logger.info('Response: images-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'combined.pdf', 'application/pdf');
  } catch (error) { next(error); }
};
