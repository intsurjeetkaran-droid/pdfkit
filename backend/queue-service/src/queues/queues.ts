import { Queue } from 'bullmq';
import { redisConnection } from './connection';

// Default job options applied to all queues
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 }
};

// PDF operations queue — merge, split, rotate, extract, delete-pages, reorder, watermark
export const pdfQueue = new Queue('pdf-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Office/image conversion queue — word-to-pdf, pdf-to-image, image-to-pdf, pdf-to-word
export const conversionQueue = new Queue('conversion-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// PDF compression queue — Ghostscript compression jobs
export const compressionQueue = new Queue('compression-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Cleanup queue — delete expired temp files
export const cleanupQueue = new Queue('cleanup-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Organization queue — reorder, duplicate, remove pages
export const organizationQueue = new Queue('organization-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Security queue — protect, unlock, remove-metadata
export const securityQueue = new Queue('security-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Metadata queue — extract info, page count, preview generation
export const metadataQueue = new Queue('metadata-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// HTML queue — html-to-pdf, url-to-pdf, html-string-to-pdf
export const htmlQueue = new Queue('html-jobs', {
  connection: redisConnection,
  defaultJobOptions
});

// Export all queues for Bull Board registration
export const allQueues = [
  pdfQueue,
  conversionQueue,
  compressionQueue,
  cleanupQueue,
  organizationQueue,
  securityQueue,
  metadataQueue,
  htmlQueue
];
