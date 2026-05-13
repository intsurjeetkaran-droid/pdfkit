import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import logger from '../logger';
import { TEMP_DIR, PROCESSED_DIR } from '../utils/upload';

const prisma = new PrismaClient();

// Default TTL: 1 hour
const FILE_TTL_MS = parseInt(process.env.FILE_TTL_MS || String(60 * 60 * 1000), 10);

// ─────────────────────────────────────────────
// SAVE TEMP FILE: Record uploaded guest file in DB
// No userId required — fully anonymous
// ─────────────────────────────────────────────
export const saveTempFileMetadata = async (file: Express.Multer.File) => {
  const expiresAt = new Date(Date.now() + FILE_TTL_MS);

  logger.info('Saving temp file metadata', {
    originalName: file.originalname,
    size: file.size,
    expiresAt
  });

  const record = await prisma.file.create({
    data: {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      isTemporary: true,
      expiresAt
    }
  });

  logger.info('Temp file metadata saved', { fileId: record.id });
  return record;
};

// ─────────────────────────────────────────────
// SAVE PROCESSED FILE: Record output file in DB
// ─────────────────────────────────────────────
export const saveProcessedFileMetadata = async (
  filePath: string,
  originalName: string,
  mimeType: string = 'application/pdf'
) => {
  const stats = fs.statSync(filePath);
  const expiresAt = new Date(Date.now() + FILE_TTL_MS);
  const storedName = path.basename(filePath);

  const record = await prisma.file.create({
    data: {
      originalName,
      storedName,
      mimeType,
      size: stats.size,
      path: filePath,
      isTemporary: true,
      expiresAt
    }
  });

  logger.info('Processed file metadata saved', { fileId: record.id, filePath });
  return record;
};

// ─────────────────────────────────────────────
// GET FILE BY ID: Fetch file record from DB
// ─────────────────────────────────────────────
export const getFileById = async (fileId: string) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) {
    const err: any = new Error('File not found');
    err.statusCode = 404;
    throw err;
  }

  // Check if file has expired
  if (file.expiresAt && file.expiresAt < new Date()) {
    const err: any = new Error('File has expired and is no longer available');
    err.statusCode = 410;
    throw err;
  }

  return file;
};

// ─────────────────────────────────────────────
// DELETE FILE: Remove file from disk and DB
// ─────────────────────────────────────────────
export const deleteFileById = async (fileId: string) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) {
    const err: any = new Error('File not found');
    err.statusCode = 404;
    throw err;
  }

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
    logger.info('File deleted from disk', { path: file.path });
  }

  await prisma.file.delete({ where: { id: fileId } });
  logger.info('File record deleted from DB', { fileId });
};

// ─────────────────────────────────────────────
// CLEANUP EXPIRED FILES: Delete files past their TTL
// Called by cleanup worker and scheduler
// ─────────────────────────────────────────────
export const cleanupExpiredFiles = async (): Promise<number> => {
  const now = new Date();

  const expiredFiles = await prisma.file.findMany({
    where: {
      isTemporary: true,
      expiresAt: { lt: now }
    }
  });

  let deletedCount = 0;

  for (const file of expiredFiles) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      await prisma.file.delete({ where: { id: file.id } });
      deletedCount++;
    } catch (error) {
      logger.warn('Failed to cleanup expired file', { fileId: file.id, error });
    }
  }

  logger.info('Expired file cleanup completed', { deletedCount, total: expiredFiles.length });
  return deletedCount;
};

// ─────────────────────────────────────────────
// GET STORAGE STATS: Disk usage summary
// ─────────────────────────────────────────────
export const getStorageStats = async () => {
  const [totalFiles, tempFiles, totalSize] = await Promise.all([
    prisma.file.count(),
    prisma.file.count({ where: { isTemporary: true } }),
    prisma.file.aggregate({ _sum: { size: true } })
  ]);

  // Disk usage for storage directories
  const getDirSize = (dir: string): number => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).reduce((acc, file) => {
      try {
        return acc + fs.statSync(path.join(dir, file)).size;
      } catch {
        return acc;
      }
    }, 0);
  };

  return {
    totalFiles,
    tempFiles,
    totalSizeBytes: totalSize._sum.size || 0,
    totalSizeMB: Math.round(((totalSize._sum.size || 0) / (1024 * 1024)) * 100) / 100,
    diskUsage: {
      tempDirBytes: getDirSize(TEMP_DIR),
      processedDirBytes: getDirSize(PROCESSED_DIR)
    }
  };
};
