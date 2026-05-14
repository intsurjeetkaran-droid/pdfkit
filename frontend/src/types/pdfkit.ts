// PDFKit API types — matches backend v2.0

export interface UploadResponse {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  expiresAt: string; // ISO 8601
}

export interface FileInfo extends UploadResponse {
  isTemporary: boolean;
  createdAt: string;
}

export interface PDFToImageResponse {
  pageCount: number;
  format: 'png' | 'jpg';
  dpi: number;
  files: Array<{ page: number; filename: string }>;
}

export interface QueueJob {
  id: string;
  name: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  returnvalue?: unknown;
  failedReason?: string;
  createdAt: string;
  processedAt: string | null;
  finishedAt: string | null;
}

export interface ApiError {
  success: false;
  message: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export type WatermarkOptions = {
  text?: string;
  opacity?: number;    // 0.0–1.0
  rotation?: number;   // degrees
  pages?: number[];    // 1-indexed, empty = all
  fontSize?: number;
};

export type CompressQuality = 'screen' | 'ebook' | 'printer' | 'prepress';

export type PDFOperation =
  | 'merge'
  | 'split'
  | 'rotate'
  | 'extract'
  | 'delete-pages'
  | 'reorder'
  | 'watermark'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'ppt-to-pdf'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'compress'
  | 'pdf-to-word'
  | 'protect'
  | 'unlock'
  | 'remove-metadata';
