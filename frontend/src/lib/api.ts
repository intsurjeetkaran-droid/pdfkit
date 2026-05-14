// PDFKit API client — all calls go through the API Gateway at port 3000
// No auth required — guest-first platform

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Trigger a browser file download from a Blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Parse an error response — always returns a human-readable message */
async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function postForm(path: string, fd: FormData): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await parseError(res));
  return res;
}

// ─── PDF Service ─────────────────────────────────────────────────────────────

export async function mergePDFs(files: File[]): Promise<Blob> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  return (await postForm('/api/pdf/merge', fd)).blob();
}

export async function splitPDF(file: File, pages: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('pages', JSON.stringify(pages));
  return (await postForm('/api/pdf/split', fd)).blob();
}

export async function rotatePDF(file: File, angle: 90 | 180 | 270, pages: number[] = []): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('angle', String(angle));
  fd.append('pages', JSON.stringify(pages));
  return (await postForm('/api/pdf/rotate', fd)).blob();
}

export async function extractPages(file: File, fromPage: number, toPage: number): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('fromPage', String(fromPage));
  fd.append('toPage', String(toPage));
  return (await postForm('/api/pdf/extract', fd)).blob();
}

export async function deletePages(file: File, pages: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('pages', JSON.stringify(pages));
  return (await postForm('/api/pdf/delete-pages', fd)).blob();
}

export async function reorderPages(file: File, order: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('order', JSON.stringify(order));
  return (await postForm('/api/pdf/reorder', fd)).blob();
}

export async function addWatermark(
  file: File,
  options: {
    text?: string;
    watermarkImage?: File;
    opacity?: number;
    rotation?: number;
    pages?: number[];
    fontSize?: number;
  }
): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  if (options.text) fd.append('text', options.text);
  if (options.watermarkImage) fd.append('watermarkImage', options.watermarkImage);
  if (options.opacity !== undefined) fd.append('opacity', String(options.opacity));
  if (options.rotation !== undefined) fd.append('rotation', String(options.rotation));
  if (options.fontSize !== undefined) fd.append('fontSize', String(options.fontSize));
  if (options.pages?.length) fd.append('pages', JSON.stringify(options.pages));
  return (await postForm('/api/pdf/watermark', fd)).blob();
}

// ─── Conversion Service ───────────────────────────────────────────────────────

export async function wordToPDF(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/convert/word-to-pdf', fd)).blob();
}

export async function excelToPDF(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/convert/excel-to-pdf', fd)).blob();
}

export async function pptToPDF(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/convert/ppt-to-pdf', fd)).blob();
}

export type PDFToImageResult =
  | Blob
  | { pageCount: number; format: string; dpi: number; files: { page: number; filename: string }[] };

export async function pdfToImage(
  file: File,
  format: 'png' | 'jpg' = 'png',
  dpi = 150
): Promise<PDFToImageResult> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('format', format);
  fd.append('dpi', String(dpi));
  const res = await postForm('/api/convert/pdf-to-image', fd);
  const ct = res.headers.get('Content-Type') ?? '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    return data.data;
  }
  return res.blob();
}

export async function imageToPDF(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/convert/image-to-pdf', fd)).blob();
}

export type CompressQuality = 'screen' | 'ebook' | 'printer' | 'prepress';

export async function compressPDF(file: File, quality: CompressQuality = 'ebook'): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('quality', quality);
  return (await postForm('/api/convert/compress', fd)).blob();
}

export async function pdfToWord(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/convert/pdf-to-word', fd)).blob();
}

// ─── Organization Service ─────────────────────────────────────────────────────

export async function organizeReorder(file: File, order: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('order', JSON.stringify(order));
  return (await postForm('/api/organize/reorder', fd)).blob();
}

export async function organizeDuplicate(file: File, pages: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('pages', JSON.stringify(pages));
  return (await postForm('/api/organize/duplicate', fd)).blob();
}

export async function organizeRemove(file: File, pages: number[]): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('pages', JSON.stringify(pages));
  return (await postForm('/api/organize/remove', fd)).blob();
}

// ─── Storage Service ──────────────────────────────────────────────────────────

export interface UploadResult {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  expiresAt: string;
}

export async function uploadTemp(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE_URL}/api/storage/upload-temp`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.data;
}

export async function getFileInfo(fileId: string) {
  const res = await fetch(`${BASE_URL}/api/storage/temp/${fileId}`);
  if (res.status === 410) throw new Error('File has expired and is no longer available.');
  if (res.status === 404) throw new Error('File not found.');
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  await fetch(`${BASE_URL}/api/storage/temp/${fileId}`, { method: 'DELETE' });
}

// ─── Security Service ─────────────────────────────────────────────────────────

export async function protectPDF(file: File, userPassword: string, ownerPassword?: string): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userPassword', userPassword);
  if (ownerPassword) fd.append('ownerPassword', ownerPassword);
  return (await postForm('/api/security/protect', fd)).blob();
}

export async function unlockPDF(file: File, password: string): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('password', password);
  return (await postForm('/api/security/unlock', fd)).blob();
}

export async function removeMetadata(file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  return (await postForm('/api/security/remove-metadata', fd)).blob();
}

// ─── Metadata Service ─────────────────────────────────────────────────────────

export interface PDFMetadata {
  pageCount: number;
  fileSizeBytes: number;
  fileSizeKB: number;
  fileSizeMB: number;
  pdfVersion: string;
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modDate: string | null;
  isEncrypted: boolean;
  pages: { page: number; widthPt: number; heightPt: number; widthMm: number; heightMm: number; rotation: number }[];
}

export async function getPDFInfo(file: File): Promise<PDFMetadata> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await postForm('/api/meta/info', fd);
  const data = await res.json();
  return data.data;
}

export async function getPageCount(file: File): Promise<number> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await postForm('/api/meta/page-count', fd);
  const data = await res.json();
  return data.data.pageCount;
}

export async function getPagePreview(file: File, page = 1, dpi = 96): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('page', String(page));
  fd.append('dpi', String(dpi));
  return (await postForm('/api/meta/preview', fd)).blob();
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
