import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const UPLOAD_DIR     = path.resolve(__dirname, '../uploads');
const MAX_FILE_SIZE  = 100 * 1024 * 1024; // 100MB
const MAX_FILENAME_LENGTH = 200;

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext      = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const safeName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, MAX_FILENAME_LENGTH);
    cb(null, `${uniqueId}-${safeName}${ext}`);
  }
});

// Metadata service only accepts PDFs
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error(`Only PDF files are accepted. Got: ${file.mimetype}`));
  }
};

const _uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).single('file');

export const uploadSingle = (req: Request, res: Response, next: NextFunction): void => {
  _uploadSingle(req, res, (err: any) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 100MB'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Unexpected field. Use "file" as the field name'
        : err.message || 'File upload error';
    res.status(400).json({ success: false, message });
  });
};
