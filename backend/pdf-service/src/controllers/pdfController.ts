import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  mergePDFs,
  splitPDF,
  rotatePDF,
  extractPages,
  deletePages,
  reorderPages,
  watermarkPDF
} from '../services/pdfService';
import {
  splitSchema,
  rotateSchema,
  extractSchema,
  deletePagesSchema,
  reorderSchema,
  watermarkSchema
} from '../services/pdfValidation';
import logger from '../logger';
import { Timer } from '../utils/timer';

// ── Stream helper ─────────────────────────────────────────────────────────────
// Streams the output file to the client then deletes it from disk.
// Memory-safe for large PDFs — never loads the whole file into RAM.
const sendFileAndCleanup = (res: Response, filePath: string, downloadName: string): void => {
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.setHeader('Content-Type', 'application/pdf');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  stream.on('close', () =>
    fs.unlink(filePath, (err) => {
      if (err) logger.warn('Could not delete output file', { filePath });
    })
  );

  stream.on('error', (err) => {
    logger.error('Stream error while sending PDF', { filePath, error: err.message });
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'File download failed' });
    }
  });
};

// ── POST /api/pdf/merge ───────────────────────────────────────────────────────
export const merge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-merge');
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length < 2) {
      res.status(400).json({ success: false, message: 'At least 2 PDF files are required' });
      return;
    }

    logger.info('Request: merge', {
      fileCount: files.length,
      totalSizeKB: Math.round(files.reduce((s, f) => s + f.size, 0) / 1024)
    });

    const filePaths = files.map((f) => f.path);
    const outputPath = await mergePDFs(filePaths);
    t.step('merge');

    // Delete all uploaded source files
    await Promise.all(filePaths.map((p) => fs.promises.unlink(p).catch(() => {})));
    t.step('cleanup-inputs');

    logger.info('Response: merge', t.summary());
    sendFileAndCleanup(res, outputPath, 'merged.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/split ───────────────────────────────────────────────────────
export const split = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-split');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let body: { pages: number[] };
    try {
      body = splitSchema.parse({ pages: JSON.parse(req.body.pages || '[]') });
    } catch {
      res.status(400).json({ success: false, message: 'pages must be a JSON array of integers' });
      return;
    }

    logger.info('Request: split', { sizeKB: Math.round(file.size / 1024), pages: body.pages });

    const outputPath = await splitPDF(file.path, body.pages);
    t.step('split');
    fs.unlink(file.path, () => {});

    logger.info('Response: split', t.summary());
    sendFileAndCleanup(res, outputPath, 'split.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/rotate ──────────────────────────────────────────────────────
export const rotate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-rotate');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let body: { pages: number[]; angle: 90 | 180 | 270 };
    try {
      body = rotateSchema.parse({
        pages: JSON.parse(req.body.pages || '[]'),
        angle: parseInt(req.body.angle, 10)
      });
    } catch {
      res.status(400).json({ success: false, message: 'angle must be 90, 180, or 270' });
      return;
    }

    logger.info('Request: rotate', { sizeKB: Math.round(file.size / 1024), angle: body.angle });

    const outputPath = await rotatePDF(file.path, body.pages, body.angle);
    t.step('rotate');
    fs.unlink(file.path, () => {});

    logger.info('Response: rotate', t.summary());
    sendFileAndCleanup(res, outputPath, 'rotated.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/extract ─────────────────────────────────────────────────────
export const extract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-extract');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let body: { fromPage: number; toPage: number };
    try {
      body = extractSchema.parse({
        fromPage: parseInt(req.body.fromPage, 10),
        toPage: parseInt(req.body.toPage, 10)
      });
    } catch {
      res.status(400).json({ success: false, message: 'fromPage and toPage are required integers' });
      return;
    }

    logger.info('Request: extract', { sizeKB: Math.round(file.size / 1024), ...body });

    const outputPath = await extractPages(file.path, body.fromPage, body.toPage);
    t.step('extract');
    fs.unlink(file.path, () => {});

    logger.info('Response: extract', t.summary());
    sendFileAndCleanup(res, outputPath, 'extracted.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/delete-pages ────────────────────────────────────────────────
export const deletePagesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-delete-pages');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let body: { pages: number[] };
    try {
      body = deletePagesSchema.parse({ pages: JSON.parse(req.body.pages || '[]') });
    } catch {
      res.status(400).json({ success: false, message: 'pages must be a JSON array of integers' });
      return;
    }

    logger.info('Request: delete-pages', { sizeKB: Math.round(file.size / 1024), pages: body.pages });

    const outputPath = await deletePages(file.path, body.pages);
    t.step('delete-pages');
    fs.unlink(file.path, () => {});

    logger.info('Response: delete-pages', t.summary());
    sendFileAndCleanup(res, outputPath, 'pages-deleted.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/reorder ─────────────────────────────────────────────────────
export const reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-reorder');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let body: { order: number[] };
    try {
      body = reorderSchema.parse({ order: JSON.parse(req.body.order || '[]') });
    } catch {
      res.status(400).json({ success: false, message: 'order must be a JSON array of page numbers' });
      return;
    }

    logger.info('Request: reorder', { sizeKB: Math.round(file.size / 1024), order: body.order });

    const outputPath = await reorderPages(file.path, body.order);
    t.step('reorder');
    fs.unlink(file.path, () => {});

    logger.info('Response: reorder', t.summary());
    sendFileAndCleanup(res, outputPath, 'reordered.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/pdf/watermark ───────────────────────────────────────────────────
export const watermark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-watermark');
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const pdfFile = files?.['file']?.[0];

    if (!pdfFile) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    const watermarkImageFile = files?.['watermarkImage']?.[0];

    let options: any;
    try {
      options = watermarkSchema.parse({
        text:     req.body.text     || undefined,
        opacity:  req.body.opacity  ? parseFloat(req.body.opacity)  : undefined,
        rotation: req.body.rotation ? parseFloat(req.body.rotation) : undefined,
        pages:    req.body.pages    ? JSON.parse(req.body.pages)    : undefined,
        fontSize: req.body.fontSize ? parseInt(req.body.fontSize, 10) : undefined
      });
    } catch {
      res.status(400).json({ success: false, message: 'Invalid watermark parameters' });
      return;
    }

    if (!options.text && !watermarkImageFile) {
      res.status(400).json({ success: false, message: 'Either text or watermarkImage is required' });
      return;
    }

    logger.info('Request: watermark', {
      sizeKB: Math.round(pdfFile.size / 1024),
      hasText: !!options.text,
      hasImage: !!watermarkImageFile
    });

    const outputPath = await watermarkPDF(pdfFile.path, {
      ...options,
      imagePath: watermarkImageFile?.path
    });
    t.step('watermark');

    fs.unlink(pdfFile.path, () => {});
    if (watermarkImageFile) fs.unlink(watermarkImageFile.path, () => {});

    logger.info('Response: watermark', t.summary());
    sendFileAndCleanup(res, outputPath, 'watermarked.pdf');
  } catch (error) {
    next(error);
  }
};
