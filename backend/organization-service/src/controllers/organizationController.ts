import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { reorderPages, duplicatePages, removePages } from '../services/organizationService';
import logger from '../logger';
import { Timer } from '../utils/timer';

const sendFileAndCleanup = (res: Response, filePath: string, downloadName: string): void => {
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.setHeader('Content-Type', 'application/pdf');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  stream.on('close', () => fs.unlink(filePath, () => {}));
  stream.on('error', (err) => {
    logger.error('Stream error', { filePath, error: err.message });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'File download failed' });
  });
};

// ── POST /api/organize/reorder ────────────────────────────────────────────────
export const reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-organize-reorder');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let order: number[];
    try {
      order = JSON.parse(req.body.order || '[]');
      if (!Array.isArray(order) || order.length === 0) throw new Error();
    } catch {
      res.status(400).json({ success: false, message: 'order must be a non-empty JSON array' });
      return;
    }

    logger.info('Request: organize/reorder', { sizeKB: Math.round(file.size / 1024), order });

    const outputPath = await reorderPages(file.path, order);
    t.step('reorder');
    fs.unlink(file.path, () => {});

    logger.info('Response: organize/reorder', t.summary());
    sendFileAndCleanup(res, outputPath, 'reordered.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/organize/duplicate ──────────────────────────────────────────────
export const duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-organize-duplicate');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let pages: number[];
    try {
      pages = JSON.parse(req.body.pages || '[]');
      if (!Array.isArray(pages) || pages.length === 0) throw new Error();
    } catch {
      res.status(400).json({ success: false, message: 'pages must be a non-empty JSON array' });
      return;
    }

    logger.info('Request: organize/duplicate', { sizeKB: Math.round(file.size / 1024), pages });

    const outputPath = await duplicatePages(file.path, pages);
    t.step('duplicate');
    fs.unlink(file.path, () => {});

    logger.info('Response: organize/duplicate', t.summary());
    sendFileAndCleanup(res, outputPath, 'duplicated.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/organize/remove ─────────────────────────────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-organize-remove');
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'PDF file is required' }); return; }

    let pages: number[];
    try {
      pages = JSON.parse(req.body.pages || '[]');
      if (!Array.isArray(pages) || pages.length === 0) throw new Error();
    } catch {
      res.status(400).json({ success: false, message: 'pages must be a non-empty JSON array' });
      return;
    }

    logger.info('Request: organize/remove', { sizeKB: Math.round(file.size / 1024), pages });

    const outputPath = await removePages(file.path, pages);
    t.step('remove');
    fs.unlink(file.path, () => {});

    logger.info('Response: organize/remove', t.summary());
    sendFileAndCleanup(res, outputPath, 'pages-removed.pdf');
  } catch (error) {
    next(error);
  }
};
