import { Router } from 'express';
import { uploadSingle } from '../utils/upload';
import {
  uploadTempFile,
  getTempFileInfo,
  downloadTempFile,
  deleteTempFile,
  runCleanup,
  getStats
} from '../controllers/storageController';

const router = Router();

/**
 * POST /api/storage/upload-temp
 * Body: multipart/form-data — field "file"
 * No auth required — anonymous guest upload
 * Response: { fileId, originalName, mimeType, size, downloadUrl, expiresAt }
 */
router.post('/upload-temp', uploadSingle, uploadTempFile);

/**
 * GET /api/storage/stats
 * Response: total files, total size, disk usage
 */
router.get('/stats', getStats);

/**
 * GET /api/storage/temp/:id
 * Response: file metadata + download URL
 */
router.get('/temp/:id', getTempFileInfo);

/**
 * GET /api/storage/temp/:id/download
 * Response: file stream download
 */
router.get('/temp/:id/download', downloadTempFile);

/**
 * DELETE /api/storage/temp/:id
 * Delete a temp file
 */
router.delete('/temp/:id', deleteTempFile);

/**
 * POST /api/storage/cleanup
 * Manually trigger expired file cleanup
 */
router.post('/cleanup', runCleanup);

export default router;
