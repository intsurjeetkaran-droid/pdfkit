import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { htmlFileToPdf, urlToPdf, htmlStringToPdf, HtmlPdfOptions } from '../services/htmlService';
import logger from '../logger';
import { Timer } from '../utils/timer';

// ── Stream helper ─────────────────────────────────────────────────────────────
const sendFileAndCleanup = (
  res: Response,
  filePath: string,
  downloadName: string,
  mimeType: string
): void => {
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.setHeader('Content-Type', mimeType);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('close', () => fs.unlink(filePath, () => {}));
  stream.on('error', (err) => {
    logger.error('Stream error while sending file', { filePath, error: err.message });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'File download failed' });
  });
};

// ── Parse shared PDF options from request body ────────────────────────────────
function parsePdfOptions(body: Record<string, string>): HtmlPdfOptions {
  const validFormats = ['A4', 'A3', 'Letter', 'Legal', 'Tabloid'] as const;
  const validWaitUntil = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] as const;

  const format = validFormats.includes(body.format as typeof validFormats[number])
    ? (body.format as typeof validFormats[number])
    : 'A4';

  const landscape = body.landscape === 'true';
  const printBackground = body.printBackground !== 'false'; // default true
  const scale = Math.min(Math.max(parseFloat(body.scale) || 1, 0.1), 2);
  const waitUntil = validWaitUntil.includes(body.waitUntil as typeof validWaitUntil[number])
    ? (body.waitUntil as typeof validWaitUntil[number])
    : undefined;

  const margin: HtmlPdfOptions['margin'] = {};
  if (body.marginTop)    margin.top    = body.marginTop;
  if (body.marginRight)  margin.right  = body.marginRight;
  if (body.marginBottom) margin.bottom = body.marginBottom;
  if (body.marginLeft)   margin.left   = body.marginLeft;

  return {
    format,
    landscape,
    printBackground,
    scale,
    ...(waitUntil && { waitUntil }),
    ...(Object.keys(margin).length > 0 && { margin })
  };
}

// ── POST /api/html/file-to-pdf ────────────────────────────────────────────────
// Body: multipart/form-data — field "file" (HTML file) + optional PDF options
export const htmlFileToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-html-file-to-pdf');
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'HTML file is required' });
      return;
    }
    if (file.size === 0) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ success: false, message: 'File is empty (0 bytes)' });
      return;
    }

    const options = parsePdfOptions(req.body);
    logger.info('Request: html-file-to-pdf', {
      originalName: file.originalname,
      sizeKB: Math.round(file.size / 1024),
      options
    });

    const outputPath = await htmlFileToPdf(file.path, options);
    t.step('conversion');
    fs.unlink(file.path, () => {});

    const downloadName = `${path.basename(file.originalname, path.extname(file.originalname))}.pdf`;
    logger.info('Response: html-file-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, downloadName, 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/html/url-to-pdf ─────────────────────────────────────────────────
// Body: JSON — { url: string, ...pdfOptions }
export const urlToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-url-to-pdf');
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string' || url.trim() === '') {
      res.status(400).json({ success: false, message: 'url is required in the request body' });
      return;
    }

    // Basic URL validation — must be http or https
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      res.status(400).json({ success: false, message: 'Invalid URL format' });
      return;
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ success: false, message: 'Only http and https URLs are supported' });
      return;
    }

    const options = parsePdfOptions(req.body);
    logger.info('Request: url-to-pdf', { url: parsedUrl.href, options });

    const outputPath = await urlToPdf(parsedUrl.href, options);
    t.step('conversion');

    // Derive a filename from the URL hostname
    const hostname = parsedUrl.hostname.replace(/[^a-zA-Z0-9-]/g, '_');
    const downloadName = `${hostname}.pdf`;

    logger.info('Response: url-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, downloadName, 'application/pdf');
  } catch (error) { next(error); }
};

// ── POST /api/html/string-to-pdf ──────────────────────────────────────────────
// Body: JSON — { html: string, ...pdfOptions }
export const htmlStringToPdfHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const t = new Timer('http-html-string-to-pdf');
  try {
    const { html } = req.body as { html?: string };
    if (!html || typeof html !== 'string' || html.trim() === '') {
      res.status(400).json({ success: false, message: 'html string is required in the request body' });
      return;
    }
    if (html.length > 5 * 1024 * 1024) { // 5MB string limit
      res.status(400).json({ success: false, message: 'HTML content too large. Maximum is 5MB' });
      return;
    }

    const options = parsePdfOptions(req.body);
    logger.info('Request: html-string-to-pdf', { contentLength: html.length, options });

    const outputPath = await htmlStringToPdf(html, options);
    t.step('conversion');

    logger.info('Response: html-string-to-pdf', t.summary({ outputPath }));
    sendFileAndCleanup(res, outputPath, 'document.pdf', 'application/pdf');
  } catch (error) { next(error); }
};
