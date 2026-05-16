import { Router } from 'express';
import { uploadSingle, uploadMultipleImages } from '../utils/upload';
import {
  officeToPdfHandler,
  pdfToImageHandler,
  imageToPdfHandler,
  compressPdfHandler,
  pdfToWordHandler,
  pdfToTextHandler,
  svgToPdfHandler,
  imagesToPdfHandler
} from '../controllers/conversionController';

const router = Router();

// All routes are public — no auth required

/**
 * POST /api/convert/word-to-pdf
 * Body: multipart/form-data — field "file" (DOCX/DOC)
 */
router.post('/word-to-pdf', uploadSingle, officeToPdfHandler);

/**
 * POST /api/convert/excel-to-pdf
 * Body: multipart/form-data — field "file" (XLSX/XLS)
 */
router.post('/excel-to-pdf', uploadSingle, officeToPdfHandler);

/**
 * POST /api/convert/ppt-to-pdf
 * Body: multipart/form-data — field "file" (PPTX/PPT)
 */
router.post('/ppt-to-pdf', uploadSingle, officeToPdfHandler);

/**
 * POST /api/convert/pdf-to-image
 * Body: multipart/form-data — field "file" (PDF) + optional "format" (png|jpg) + optional "dpi"
 */
router.post('/pdf-to-image', uploadSingle, pdfToImageHandler);

/**
 * POST /api/convert/image-to-pdf
 * Body: multipart/form-data — field "file" (PNG/JPEG/WebP/TIFF/BMP)
 */
router.post('/image-to-pdf', uploadSingle, imageToPdfHandler);

/**
 * POST /api/convert/compress
 * Body: multipart/form-data — field "file" (PDF) + optional "quality" (screen|ebook|printer|prepress)
 */
router.post('/compress', uploadSingle, compressPdfHandler);

/**
 * POST /api/convert/pdf-to-word
 * Body: multipart/form-data — field "file" (PDF)
 * Uses LibreOffice to convert PDF → DOCX
 */
router.post('/pdf-to-word', uploadSingle, pdfToWordHandler);

/**
 * POST /api/convert/pdf-to-text
 * Body: multipart/form-data — field "file" (PDF)
 * Uses pdftotext (poppler-utils) to extract text content
 */
router.post('/pdf-to-text', uploadSingle, pdfToTextHandler);

/**
 * POST /api/convert/svg-to-pdf
 * Body: multipart/form-data — field "file" (SVG) + optional "pageSize" (A4|Letter|auto) + optional "orientation" (portrait|landscape)
 */
router.post('/svg-to-pdf', uploadSingle, svgToPdfHandler);

/**
 * POST /api/convert/images-to-pdf
 * Body: multipart/form-data — field "files" (up to 50 images: PNG/JPEG/WebP/TIFF/BMP)
 *       + optional "pageSize", "orientation", "margin", "fit", "order"
 */
router.post('/images-to-pdf', uploadMultipleImages, imagesToPdfHandler);

export default router;
