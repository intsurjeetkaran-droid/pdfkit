import { Router } from 'express';
import { uploadSingle } from '../utils/upload';
import { reorder, duplicate, remove } from '../controllers/organizationController';

const router = Router();

/**
 * POST /api/organize/reorder
 * Body: multipart/form-data — field "file" + field "order" (JSON array)
 * Example: order=[3,1,2]
 */
router.post('/reorder', uploadSingle, reorder);

/**
 * POST /api/organize/duplicate
 * Body: multipart/form-data — field "file" + field "pages" (JSON array)
 * Example: pages=[2,3] — duplicates pages 2 and 3
 */
router.post('/duplicate', uploadSingle, duplicate);

/**
 * POST /api/organize/remove
 * Body: multipart/form-data — field "file" + field "pages" (JSON array)
 * Example: pages=[1,4] — removes pages 1 and 4
 */
router.post('/remove', uploadSingle, remove);

export default router;
