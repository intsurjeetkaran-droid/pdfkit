import { Router } from 'express';
import { uploadSingle } from '../utils/upload';
import { protect, unlock, removeMetadataController } from '../controllers/securityController';

const router = Router();

/**
 * POST /api/security/protect
 * Body: multipart/form-data
 *   file:           PDF (required)
 *   userPassword:   string (required) — password to open the PDF
 *   ownerPassword:  string (optional) — password to change permissions
 * Response: password-protected PDF download
 */
router.post('/protect', uploadSingle, protect);

/**
 * POST /api/security/unlock
 * Body: multipart/form-data
 *   file:      PDF (required) — password-protected PDF
 *   password:  string (required) — current password
 * Response: decrypted PDF download
 */
router.post('/unlock', uploadSingle, unlock);

/**
 * POST /api/security/remove-metadata
 * Body: multipart/form-data
 *   file: PDF (required)
 * Response: PDF with all metadata stripped (title, author, dates, XMP)
 */
router.post('/remove-metadata', uploadSingle, removeMetadataController);

export default router;
