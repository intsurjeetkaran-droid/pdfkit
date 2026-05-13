import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  saveTempFileMetadata,
  getFileById,
  deleteFileById,
  cleanupExpiredFiles,
  getStorageStats
} from '../services/storageService';
import logger from '../logger';

/**
 * Build the public download URL for a file.
 * Uses STORAGE_BASE_URL env var so the URL works from outside Docker.
 * Set STORAGE_BASE_URL=http://localhost:3000 in docker-compose for local dev.
 */
const buildDownloadUrl = (req: Request, fileId: string): string => {
  // Prefer explicit env var (avoids returning internal Docker hostname)
  const baseUrl = process.env.STORAGE_BASE_URL
    || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/storage/temp/${fileId}/download`;
};

// POST /api/storage/upload-temp — anonymous guest upload, no auth required
export const uploadTempFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided. Use field name "file".' });
      return;
    }

    // Reject zero-byte files
    if (file.size === 0) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ success: false, message: 'File is empty (0 bytes)' });
      return;
    }

    const record = await saveTempFileMetadata(file);
    logger.info('Guest file uploaded', { fileId: record.id, originalName: file.originalname, size: file.size });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId:       record.id,
        originalName: record.originalName,
        mimeType:     record.mimeType,
        size:         record.size,
        downloadUrl:  buildDownloadUrl(req, record.id),
        expiresAt:    record.expiresAt?.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/storage/temp/:id — file metadata, no auth required
export const getTempFileInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = await getFileById(req.params.id);
    res.json({
      success: true,
      message: 'File info fetched',
      data: {
        fileId:       file.id,
        originalName: file.originalName,
        mimeType:     file.mimeType,
        size:         file.size,
        isTemporary:  file.isTemporary,
        expiresAt:    file.expiresAt?.toISOString(),
        downloadUrl:  buildDownloadUrl(req, file.id),
        createdAt:    file.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/storage/temp/:id/download — streaming download, no auth required
export const downloadTempFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = await getFileById(req.params.id);

    if (!fs.existsSync(file.path)) {
      res.status(404).json({ success: false, message: 'File not found on disk' });
      return;
    }

    logger.info('File download started', { fileId: file.id, originalName: file.originalName });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);

    const stream = fs.createReadStream(file.path);
    stream.pipe(res);

    stream.on('error', (err) => {
      logger.error('File stream error', { fileId: file.id, error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'File download failed' });
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/storage/temp/:id — no auth required
export const deleteTempFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await deleteFileById(req.params.id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/storage/cleanup — trigger expired file cleanup
export const runCleanup = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deletedCount = await cleanupExpiredFiles();
    res.json({ success: true, message: 'Cleanup completed', data: { deletedCount } });
  } catch (error) {
    next(error);
  }
};

// GET /api/storage/stats
export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await getStorageStats();
    res.json({ success: true, message: 'Stats fetched', data: stats });
  } catch (error) {
    next(error);
  }
};
