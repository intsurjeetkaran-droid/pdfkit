import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB guest limit

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${uniqueId}-${safeName}${ext}`);
  }
});

// PDF-only filter
const pdfFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// PDF + image filter (for watermark image uploads)
const pdfOrImageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
};

// Single PDF upload
export const uploadSingle = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('file');

// Multiple PDF uploads (up to 20 files)
export const uploadMultiple = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).array('files', 20);

// Watermark: PDF + optional image
export const uploadWatermark = multer({
  storage,
  fileFilter: pdfOrImageFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 }
]);
