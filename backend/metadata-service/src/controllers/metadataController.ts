import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { extractInfo, getPageCount, generatePreview } from '../services/metadataService';
import { Timer } from '../utils/timer';
import logger from '../logger';

// ── POST /api/meta/info ───────────────────────────────────────────────────────
// Returns full PDF metadata: page count, dimensions, file size,
// document info fields (title, author, etc.), dates, encryption status.
export const info = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-meta-info');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    logger.info('Request: meta/info', { sizeKB: Math.round(file.size / 1024) });

    const metadata = await extractInfo(file.path);
    t.step('extract');
    fs.unlink(file.path, () => {});

    logger.info('Response: meta/info', t.summary({ pageCount: metadata.pageCount }));

    res.json({
      success: true,
      message: 'PDF metadata extracted',
      data: metadata
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/meta/page-count ─────────────────────────────────────────────────
// Fast endpoint — returns only the page count.
// Useful for frontend to know how many pages before showing a reorder/preview UI.
export const pageCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-meta-page-count');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    logger.info('Request: meta/page-count', { sizeKB: Math.round(file.size / 1024) });

    const count = await getPageCount(file.path);
    t.step('count');
    fs.unlink(file.path, () => {});

    logger.info('Response: meta/page-count', t.summary({ pageCount: count }));

    res.json({
      success: true,
      message: 'Page count retrieved',
      data: { pageCount: count }
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/meta/preview ────────────────────────────────────────────────────
// Generate a PNG thumbnail of a specific page.
// Query params (sent as form fields):
//   page: number (1-indexed, default 1)
//   dpi:  number (default 96, clamped 36–150)
export const preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-meta-preview');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    const page = Math.max(1, parseInt(req.body.page || '1', 10));
    const dpi  = Math.min(Math.max(parseInt(req.body.dpi  || '96', 10), 36), 150);

    logger.info('Request: meta/preview', {
      sizeKB: Math.round(file.size / 1024),
      page,
      dpi
    });

    const previewPath = await generatePreview(file.path, page, dpi);
    t.step('generate');
    fs.unlink(file.path, () => {});

    logger.info('Response: meta/preview', t.summary({ page, dpi }));

    // Stream the PNG image directly
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="preview-page-${page}.png"`);

    const stream = fs.createReadStream(previewPath);
    stream.pipe(res);
    stream.on('close', () => fs.unlink(previewPath, () => {}));
    stream.on('error', (err) => {
      logger.error('Preview stream error', { previewPath, error: err.message });
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Preview generation failed' });
    });
  } catch (error) {
    next(error);
  }
};
