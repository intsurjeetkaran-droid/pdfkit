import { Router } from 'express';
import { uploadSingle, uploadMultiple, uploadWatermark } from '../utils/upload';
import {
  merge,
  split,
  rotate,
  extract,
  deletePagesController,
  reorder,
  watermark
} from '../controllers/pdfController';

const router = Router();

// All routes are public — no auth required

/**
 * POST /api/pdf/merge
 * Body: multipart/form-data — field "files" (2–20 PDFs)
 */
router.post('/merge', uploadMultiple, merge);

/**
 * POST /api/pdf/split
 * Body: multipart/form-data — field "file" + field "pages" (JSON array)
 * Example: pages=[1,3,5]
 */
router.post('/split', uploadSingle, split);

/**
 * POST /api/pdf/rotate
 * Body: multipart/form-data — field "file" + field "pages" (JSON array) + field "angle" (90|180|270)
 */
router.post('/rotate', uploadSingle, rotate);

/**
 * POST /api/pdf/extract
 * Body: multipart/form-data — field "file" + field "fromPage" + field "toPage"
 */
router.post('/extract', uploadSingle, extract);

/**
 * POST /api/pdf/delete-pages
 * Body: multipart/form-data — field "file" + field "pages" (JSON array)
 */
router.post('/delete-pages', uploadSingle, deletePagesController);

/**
 * POST /api/pdf/reorder
 * Body: multipart/form-data — field "file" + field "order" (JSON array)
 * Example: order=[3,1,2] — page 3 first, then 1, then 2
 */
router.post('/reorder', uploadSingle, reorder);

/**
 * POST /api/pdf/watermark
 * Body: multipart/form-data — field "file" (PDF) + optional "watermarkImage" (PNG/JPEG)
 * Fields: text, opacity (0-1), rotation (degrees), pages (JSON array), fontSize
 */
router.post('/watermark', uploadWatermark, watermark);

export default router;
