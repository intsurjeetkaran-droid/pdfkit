import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { protectPDF, unlockPDF, removeMetadata } from '../services/securityService';
import { Timer } from '../utils/timer';
import logger from '../logger';

// ── Stream helper ─────────────────────────────────────────────────────────────
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

// ── POST /api/security/protect ────────────────────────────────────────────────
// Body: multipart/form-data
//   file:           PDF (required)
//   userPassword:   string (required) — password to open the PDF
//   ownerPassword:  string (optional) — password to change permissions
//                   defaults to userPassword if not provided
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-protect');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    const userPassword  = req.body.userPassword?.trim();
    const ownerPassword = req.body.ownerPassword?.trim() || undefined;

    if (!userPassword) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ success: false, message: 'userPassword is required' });
      return;
    }

    logger.info('Request: security/protect', {
      sizeKB: Math.round(file.size / 1024),
      hasOwnerPassword: !!ownerPassword
    });

    const outputPath = await protectPDF(file.path, userPassword, ownerPassword);
    t.step('protect');
    fs.unlink(file.path, () => {});

    logger.info('Response: security/protect', t.summary());
    sendFileAndCleanup(res, outputPath, 'protected.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/security/unlock ─────────────────────────────────────────────────
// Body: multipart/form-data
//   file:      PDF (required) — password-protected PDF
//   password:  string (required) — current password to decrypt
export const unlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-unlock');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    const password = req.body.password?.trim();
    if (!password) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ success: false, message: 'password is required to unlock the PDF' });
      return;
    }

    logger.info('Request: security/unlock', { sizeKB: Math.round(file.size / 1024) });

    const outputPath = await unlockPDF(file.path, password);
    t.step('unlock');
    fs.unlink(file.path, () => {});

    logger.info('Response: security/unlock', t.summary());
    sendFileAndCleanup(res, outputPath, 'unlocked.pdf');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/security/remove-metadata ───────────────────────────────────────
// Body: multipart/form-data
//   file: PDF (required)
// Strips: title, author, subject, keywords, creator, producer,
//         creation date, modification date, XMP metadata stream
export const removeMetadataController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t = new Timer('http-remove-metadata');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    logger.info('Request: security/remove-metadata', { sizeKB: Math.round(file.size / 1024) });

    const outputPath = await removeMetadata(file.path);
    t.step('remove-metadata');
    fs.unlink(file.path, () => {});

    logger.info('Response: security/remove-metadata', t.summary());
    sendFileAndCleanup(res, outputPath, 'no-metadata.pdf');
  } catch (error) {
    next(error);
  }
};
