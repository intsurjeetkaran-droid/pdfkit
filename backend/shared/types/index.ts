// ============================================================
// Shared TypeScript types used across all microservices
// Guest-first — no auth required for PDF operations
// ============================================================

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Guest file upload response
export interface GuestFileResponse {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  expiresAt: string;
}

// File metadata stored after upload
export interface FileMetadata {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  isTemporary: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

// Job status tracking
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobRecord {
  id: string;
  queue: string;
  status: JobStatus;
  progress: number;
  inputFileId?: string | null;
  outputFileId?: string | null;
  error?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
}

// ─────────────────────────────────────────────
// BullMQ job payloads — all guest-safe (no userId)
// ─────────────────────────────────────────────

export interface MergePdfJobPayload {
  files: string[];
  outputPath: string;
}

export interface SplitPdfJobPayload {
  filePath: string;
  pages: number[];
  outputDir: string;
}

export interface RotatePdfJobPayload {
  filePath: string;
  pages: number[];
  angle: 90 | 180 | 270;
  outputPath: string;
}

export interface WatermarkJobPayload {
  filePath: string;
  text?: string;
  imagePath?: string;
  opacity?: number;
  rotation?: number;
  pages?: number[];
  outputPath: string;
}

export interface ReorderJobPayload {
  filePath: string;
  order: number[];
  outputPath: string;
}

export interface ConvertJobPayload {
  inputPath: string;
  outputDir: string;
  format: 'pdf' | 'png' | 'jpg' | 'docx';
}

export interface CompressJobPayload {
  inputPath: string;
  outputPath: string;
  quality: 'screen' | 'ebook' | 'printer' | 'prepress';
}

export interface OrganizeJobPayload {
  filePath: string;
  operation: 'reorder' | 'duplicate' | 'remove';
  pages?: number[];
  order?: number[];
  outputPath: string;
}

export interface SecurityJobPayload {
  filePath: string;
  operation: 'protect' | 'unlock' | 'remove-metadata';
  password?: string;
  outputPath: string;
}

export interface MetadataJobPayload {
  filePath: string;
  operation: 'info' | 'page-count' | 'preview';
  page?: number;
}

export interface CleanupJobPayload {
  filePaths: string[];
}

// Authenticated user (for future auth integration)
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}
