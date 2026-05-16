import { Router } from 'express';
import { uploadSingle } from '../utils/upload';
import {
  htmlFileToPdfHandler,
  urlToPdfHandler,
  htmlStringToPdfHandler
} from '../controllers/htmlController';

const router = Router();

// All routes are public — no auth required

/**
 * POST /api/html/file-to-pdf
 * Body: multipart/form-data — field "file" (HTML file)
 * Optional body fields: format, landscape, printBackground, scale,
 *                       marginTop, marginRight, marginBottom, marginLeft, waitUntil
 */
router.post('/file-to-pdf', uploadSingle, htmlFileToPdfHandler);

/**
 * POST /api/html/url-to-pdf
 * Body: JSON — { url: string, format?, landscape?, printBackground?, scale?,
 *                marginTop?, marginRight?, marginBottom?, marginLeft?, waitUntil? }
 */
router.post('/url-to-pdf', urlToPdfHandler);

/**
 * POST /api/html/string-to-pdf
 * Body: JSON — { html: string, format?, landscape?, printBackground?, scale?,
 *                marginTop?, marginRight?, marginBottom?, marginLeft?, waitUntil? }
 */
router.post('/string-to-pdf', htmlStringToPdfHandler);

export default router;
