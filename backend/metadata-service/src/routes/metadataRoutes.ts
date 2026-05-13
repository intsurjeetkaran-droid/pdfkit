import { Router } from 'express';
import { uploadSingle } from '../utils/upload';
import { info, pageCount, preview } from '../controllers/metadataController';

const router = Router();

/**
 * POST /api/meta/info
 * Body: multipart/form-data — field "file" (PDF)
 * Response: JSON with full metadata (pageCount, dimensions, title, author, dates, etc.)
 */
router.post('/info', uploadSingle, info);

/**
 * POST /api/meta/page-count
 * Body: multipart/form-data — field "file" (PDF)
 * Response: { pageCount: number }
 * Fast endpoint — use this before showing a reorder/preview UI.
 */
router.post('/page-count', uploadSingle, pageCount);

/**
 * POST /api/meta/preview
 * Body: multipart/form-data — field "file" (PDF)
 *   + optional field "page" (1-indexed, default 1)
 *   + optional field "dpi"  (36–150, default 96)
 * Response: PNG image stream (inline)
 */
router.post('/preview', uploadSingle, preview);

export default router;
