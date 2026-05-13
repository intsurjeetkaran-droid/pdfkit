import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Guest upload limit: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;
// Max filename length before sanitization
const MAX_FILENAME_LENGTH = 200;

const TEMP_DIR      = path.resolve(__dirname, '../../storage/temp');
const PROCESSED_DIR = path.resolve(__dirname, '../../storage/processed');
const CACHE_DIR     = path.resolve(__dirname, '../../storage/cache');

[TEMP_DIR, PROCESSED_DIR, CACHE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10); // cap extension
    // Sanitize and truncate the base name
    const rawBase = path.basename(file.originalname, path.extname(file.originalname));
    const safeName = rawBase
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, MAX_FILENAME_LENGTH);
    cb(null, `${uniqueId}-${safeName}${ext}`);
  }
});

const ALLOWED_MIMES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff', 'image/bmp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

// ── Multer instances ──────────────────────────────────────────────────────────
const _uploadSingle   = multer({ storage: tempStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).single('file');
const _uploadMultiple = multer({ storage: tempStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).array('files', 20);

/**
 * Wrapper that converts multer errors (wrong field name, wrong MIME, too large)
 * into proper 400 JSON responses instead of crashing with 500.
 */
export const uploadSingle = (req: Request, res: Response, next: NextFunction): void => {
  _uploadSingle(req, res, (err: any) => {
    if (!err) return next();
    const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 100MB'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? `Unexpected field. Use "file" as the field name`
        : err.message || 'File upload error';
    res.status(status).json({ success: false, message });
  });
};

export const uploadMultiple = (req: Request, res: Response, next: NextFunction): void => {
  _uploadMultiple(req, res, (err: any) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 100MB'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? `Unexpected field. Use "files" as the field name`
        : err.message || 'File upload error';
    res.status(400).json({ success: false, message });
  });
};

export { TEMP_DIR, PROCESSED_DIR, CACHE_DIR };
