import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../logger/logger';

// Generate a unique filename to prevent collisions
export const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  // Sanitize base name — remove special characters
  const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${timestamp}-${uniqueId}-${safeName}${ext}`;
};

// Safely delete a file — logs warning if file doesn't exist
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted', { path: filePath });
    } else {
      logger.warn('Attempted to delete non-existent file', { path: filePath });
    }
  } catch (error) {
    logger.error('Failed to delete file', { path: filePath, error });
  }
};

// Ensure a directory exists, create it if not
export const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info('Directory created', { path: dirPath });
  }
};

// Get file size in bytes
export const getFileSize = (filePath: string): number => {
  const stats = fs.statSync(filePath);
  return stats.size;
};

// Format bytes to human-readable string
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Validate that a file's MIME type is in the allowed list
export const isAllowedMimeType = (
  mimeType: string,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(mimeType);
};
