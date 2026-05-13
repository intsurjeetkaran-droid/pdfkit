// ============================================================
// Shared constants used across all microservices
// ============================================================

// Allowed MIME types for file uploads
export const ALLOWED_MIME_TYPES = {
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
  WEBP: 'image/webp',
  TIFF: 'image/tiff',
  BMP: 'image/bmp',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS: 'application/vnd.ms-excel',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  PPT: 'application/vnd.ms-powerpoint'
} as const;

// Maximum file upload size — guest: 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Temp file TTL — 1 hour in milliseconds
export const TEMP_FILE_EXPIRY_MS = 60 * 60 * 1000;

// Processed file TTL — 1 hour
export const PROCESSED_FILE_EXPIRY_MS = 60 * 60 * 1000;

// Failed job cleanup — 30 minutes
export const FAILED_JOB_EXPIRY_MS = 30 * 60 * 1000;

// BullMQ queue names
export const QUEUE_NAMES = {
  PDF_JOBS: 'pdf-jobs',
  CONVERSION_JOBS: 'conversion-jobs',
  COMPRESSION_JOBS: 'compression-jobs',
  CLEANUP_JOBS: 'cleanup-jobs',
  ORGANIZATION_JOBS: 'organization-jobs',
  SECURITY_JOBS: 'security-jobs',
  METADATA_JOBS: 'metadata-jobs'
} as const;

// BullMQ job names
export const JOB_NAMES = {
  // PDF operations
  MERGE_PDF: 'merge-pdf',
  SPLIT_PDF: 'split-pdf',
  ROTATE_PDF: 'rotate-pdf',
  COMPRESS_PDF: 'compress-pdf',
  WATERMARK_PDF: 'watermark-pdf',
  REORDER_PDF: 'reorder-pdf',
  DELETE_PAGES: 'delete-pages',
  EXTRACT_PAGES: 'extract-pages',
  // Conversion
  WORD_TO_PDF: 'word-to-pdf',
  PPT_TO_PDF: 'ppt-to-pdf',
  EXCEL_TO_PDF: 'excel-to-pdf',
  PDF_TO_IMAGE: 'pdf-to-image',
  IMAGE_TO_PDF: 'image-to-pdf',
  PDF_TO_WORD: 'pdf-to-word',
  // Organization
  ORGANIZE_REORDER: 'organize-reorder',
  ORGANIZE_DUPLICATE: 'organize-duplicate',
  ORGANIZE_REMOVE: 'organize-remove',
  // Security
  PROTECT_PDF: 'protect-pdf',
  UNLOCK_PDF: 'unlock-pdf',
  REMOVE_METADATA: 'remove-metadata',
  // Metadata
  EXTRACT_METADATA: 'extract-metadata',
  PAGE_COUNT: 'page-count',
  GENERATE_PREVIEW: 'generate-preview',
  // Cleanup
  CLEANUP_TEMP: 'cleanup-temp'
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
} as const;

// Storage directory structure
export const STORAGE_DIRS = {
  TEMP: 'storage/temp',
  PROCESSED: 'storage/processed',
  CACHE: 'storage/cache'
} as const;
