/**
 * =============================================================================
 * MinIO Client — Shared S3-Compatible Object Storage Utility
 * =============================================================================
 *
 * WHY THIS EXISTS:
 *   In Docker Compose, each service writes files to local disk volumes on the
 *   same host. This works fine for a single machine but breaks in Kubernetes
 *   where pods can be scheduled on different nodes — Pod A writes a file but
 *   Pod B handles the download request and can't find it.
 *
 *   This module provides a single shared MinIO client that ALL services use
 *   for file I/O. Every pod, regardless of which node it runs on, reads and
 *   writes from the same MinIO buckets.
 *
 * BUCKETS:
 *   - pdfkit-uploads:  Temporary uploaded files (1-hour TTL)
 *   - pdfkit-outputs:  Processed output files (deleted after download)
 *
 * USAGE:
 *   import { uploadFile, downloadFile, deleteFile, streamFile } from '../shared/utils/minioClient';
 *
 *   // Upload a local file to MinIO
 *   const objectName = await uploadFile(localPath, 'pdfkit-uploads', 'original-name.pdf');
 *
 *   // Download from MinIO to a local temp path
 *   const localPath = await downloadFile(objectName, 'pdfkit-uploads');
 *
 *   // Stream directly to HTTP response
 *   await streamFile(objectName, 'pdfkit-outputs', res);
 *
 *   // Delete after use
 *   await deleteFile(objectName, 'pdfkit-outputs');
 *
 * ENVIRONMENT VARIABLES:
 *   MINIO_ENDPOINT     — MinIO host (default: "minio" in K8s, "localhost" locally)
 *   MINIO_PORT         — MinIO port (default: 9000)
 *   MINIO_USE_SSL      — "true" for HTTPS (default: "false")
 *   MINIO_ACCESS_KEY   — Access key (from Secret in K8s)
 *   MINIO_SECRET_KEY   — Secret key (from Secret in K8s)
 *   MINIO_BUCKET_UPLOADS  — Uploads bucket name (default: "pdfkit-uploads")
 *   MINIO_BUCKET_OUTPUTS  — Outputs bucket name (default: "pdfkit-outputs")
 * =============================================================================
 */

import * as Minio from 'minio';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { Response } from 'express';

// ── MinIO client singleton ────────────────────────────────────────────────────
// Created once per process — reused across all requests.
const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  || 'minio',
  port:      parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL:    process.env.MINIO_USE_SSL   === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// ── Bucket names ──────────────────────────────────────────────────────────────
export const BUCKET_UPLOADS = process.env.MINIO_BUCKET_UPLOADS || 'pdfkit-uploads';
export const BUCKET_OUTPUTS = process.env.MINIO_BUCKET_OUTPUTS || 'pdfkit-outputs';

// ── Bucket initialization ─────────────────────────────────────────────────────
/**
 * Ensure both buckets exist. Called once at service startup.
 * Safe to call multiple times — idempotent.
 */
export async function ensureBucketsExist(): Promise<void> {
  for (const bucket of [BUCKET_UPLOADS, BUCKET_OUTPUTS]) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, 'us-east-1');
      console.log(`[MinIO] Created bucket: ${bucket}`);
    }
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────
/**
 * Upload a local file to MinIO.
 *
 * @param localFilePath  - Absolute path to the local file
 * @param bucket         - Target bucket (BUCKET_UPLOADS or BUCKET_OUTPUTS)
 * @param originalName   - Original filename (used for Content-Disposition)
 * @returns              - The MinIO object name (UUID-based, unique)
 */
export async function uploadFile(
  localFilePath: string,
  bucket: string,
  originalName: string
): Promise<string> {
  const ext = path.extname(originalName);
  const objectName = `${uuidv4()}${ext}`;

  const metaData = {
    'Content-Type': getMimeType(ext),
    'x-amz-meta-original-name': encodeURIComponent(originalName),
    'x-amz-meta-uploaded-at': new Date().toISOString(),
  };

  await minioClient.fPutObject(bucket, objectName, localFilePath, metaData);
  return objectName;
}

// ── Download ──────────────────────────────────────────────────────────────────
/**
 * Download a MinIO object to a local temp file.
 * Returns the local file path. Caller is responsible for cleanup.
 *
 * @param objectName - MinIO object name
 * @param bucket     - Source bucket
 * @returns          - Absolute path to the downloaded local file
 */
export async function downloadFile(
  objectName: string,
  bucket: string
): Promise<string> {
  const tmpDir = process.env.TMPDIR || '/tmp';
  const localPath = path.join(tmpDir, `minio-dl-${uuidv4()}${path.extname(objectName)}`);
  await minioClient.fGetObject(bucket, objectName, localPath);
  return localPath;
}

// ── Stream to HTTP response ───────────────────────────────────────────────────
/**
 * Stream a MinIO object directly to an Express HTTP response.
 * More efficient than download-then-send — no intermediate disk write.
 *
 * @param objectName   - MinIO object name
 * @param bucket       - Source bucket
 * @param res          - Express Response object
 * @param downloadName - Filename for Content-Disposition header
 */
export async function streamFile(
  objectName: string,
  bucket: string,
  res: Response,
  downloadName?: string
): Promise<void> {
  // Get object metadata to set Content-Type
  const stat = await minioClient.statObject(bucket, objectName);
  const contentType = stat.metaData?.['content-type'] || 'application/octet-stream';
  const originalName = stat.metaData?.['x-amz-meta-original-name']
    ? decodeURIComponent(stat.metaData['x-amz-meta-original-name'])
    : downloadName || objectName;

  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(originalName)}"`
  );
  if (stat.size) {
    res.setHeader('Content-Length', stat.size);
  }

  // Stream object directly to response — no buffering in memory
  const stream: Readable = await minioClient.getObject(bucket, objectName);
  stream.pipe(res);

  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
    res.on('error', reject);
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────
/**
 * Delete an object from MinIO.
 * Safe to call even if the object doesn't exist (no-op).
 *
 * @param objectName - MinIO object name
 * @param bucket     - Target bucket
 */
export async function deleteMinioFile(
  objectName: string,
  bucket: string
): Promise<void> {
  try {
    await minioClient.removeObject(bucket, objectName);
  } catch (err: any) {
    // NoSuchKey is not an error — object was already deleted or never existed
    if (err.code !== 'NoSuchKey') {
      throw err;
    }
  }
}

// ── List expired objects ──────────────────────────────────────────────────────
/**
 * List all objects in a bucket older than the given TTL.
 * Used by the cleanup scheduler to find expired temp files.
 *
 * @param bucket  - Bucket to scan
 * @param ttlMs   - TTL in milliseconds (objects older than this are returned)
 * @returns       - Array of object names to delete
 */
export async function listExpiredObjects(
  bucket: string,
  ttlMs: number
): Promise<string[]> {
  const cutoff = new Date(Date.now() - ttlMs);
  const expired: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const stream = minioClient.listObjects(bucket, '', true);
    stream.on('data', (obj) => {
      if (obj.name && obj.lastModified && obj.lastModified < cutoff) {
        expired.push(obj.name);
      }
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return expired;
}

// ── Generate presigned URL ────────────────────────────────────────────────────
/**
 * Generate a time-limited presigned URL for direct client download.
 * Useful for large files — client downloads directly from MinIO, bypassing the API.
 *
 * @param objectName - MinIO object name
 * @param bucket     - Source bucket
 * @param expirySeconds - URL validity in seconds (default: 3600 = 1 hour)
 * @returns          - Presigned download URL
 */
export async function getPresignedUrl(
  objectName: string,
  bucket: string,
  expirySeconds = 3600
): Promise<string> {
  return minioClient.presignedGetObject(bucket, objectName, expirySeconds);
}

// ── Health check ──────────────────────────────────────────────────────────────
/**
 * Check MinIO connectivity. Used in service health endpoints.
 * Returns true if MinIO is reachable, false otherwise.
 */
export async function checkMinioHealth(): Promise<boolean> {
  try {
    await minioClient.bucketExists(BUCKET_UPLOADS);
    return true;
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Map file extension to MIME type for Content-Type headers.
 */
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls':  'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt':  'application/vnd.ms-powerpoint',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.bmp':  'image/bmp',
    '.svg':  'image/svg+xml',
    '.txt':  'text/plain',
    '.html': 'text/html',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

export default minioClient;
