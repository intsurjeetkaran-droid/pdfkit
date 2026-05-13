# Frontend Integration Guide

**PDFKit v2.0 — For Frontend Developers**  
**No auth required. No signup. Works instantly.**

---

## Base URL

```
http://localhost:3000
```

In production, replace with your deployed gateway URL.

---

## The Guest Workflow

Every PDF operation follows this pattern:

```
1. User picks a file
2. POST to the operation endpoint (multipart/form-data)
3. Response is a binary PDF stream → trigger browser download
   OR
   Response is JSON with a fileId → poll status → download when ready
```

Most operations (merge, split, rotate, watermark, etc.) return the file **directly** in the response — no polling needed.

---

## How to Send Files (FormData)

All endpoints accept `multipart/form-data`. Never send JSON for file operations.

### Vanilla JS / Fetch

```javascript
// Single file operation (split, rotate, watermark, etc.)
async function splitPDF(file, pages) {
  const formData = new FormData();
  formData.append('file', file);           // File object from <input type="file">
  formData.append('pages', JSON.stringify(pages)); // "[1,3,5]"

  const response = await fetch('http://localhost:3000/api/pdf/split', {
    method: 'POST',
    body: formData
    // DO NOT set Content-Type manually — browser sets it with boundary automatically
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  // Response is a binary PDF — trigger download
  const blob = await response.blob();
  downloadBlob(blob, 'split.pdf');
}

// Multiple files (merge)
async function mergePDFs(files) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file)); // same field name, multiple times

  const response = await fetch('http://localhost:3000/api/pdf/merge', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const blob = await response.blob();
  downloadBlob(blob, 'merged.pdf');
}

// Helper: trigger browser file download from a Blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // free memory
}
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 120000 // 2 min — heavy ops like pdf-to-word can take 30s
});

// Single file operation
async function rotatePDF(file, angle, pages = []) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('angle', String(angle));       // "90"
  formData.append('pages', JSON.stringify(pages)); // "[]" = all pages

  const response = await api.post('/api/pdf/rotate', formData, {
    responseType: 'blob' // IMPORTANT: tells axios to treat response as binary
  });

  downloadBlob(response.data, 'rotated.pdf');
}

// With upload progress
async function mergePDFsWithProgress(files, onProgress) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  const response = await api.post('/api/pdf/merge', formData, {
    responseType: 'blob',
    onUploadProgress: (event) => {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent); // update your progress bar
    }
  });

  downloadBlob(response.data, 'merged.pdf');
}
```

### React Hook Example

```jsx
import { useState } from 'react';

function usePDFOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const run = async (endpoint, formData, outputFilename) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Error responses are JSON even when success responses are binary
        const err = await response.json();
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      downloadBlob(blob, outputFilename);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error, progress };
}

// Usage
function MergeTool() {
  const { run, loading, error } = usePDFOperation();

  const handleMerge = async (files) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    await run('/api/pdf/merge', fd, 'merged.pdf');
  };

  return (
    <div>
      {loading && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => handleMerge(selectedFiles)} disabled={loading}>
        Merge PDFs
      </button>
    </div>
  );
}
```

---

## Handling Binary Responses

All PDF/image/DOCX operations return a **binary stream**, not JSON.

```javascript
// Check if response is binary or JSON
async function handleResponse(response, filename) {
  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    // Error or multi-page image response
    return response.json();
  }

  // Binary file — trigger download
  const blob = await response.blob();
  downloadBlob(blob, filename);
  return null;
}
```

### Content-Type by operation

| Operation | Response Content-Type |
|-----------|----------------------|
| All PDF ops | `application/pdf` |
| image-to-pdf | `application/pdf` |
| pdf-to-image (single page) | `image/png` or `image/jpeg` |
| pdf-to-image (multi-page) | `application/json` (filenames list) |
| pdf-to-word | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| compress | `application/pdf` |
| upload-temp | `application/json` |

---

## Upload a File (Temp Storage)

Use this when you want to upload first, then process later, or share a download link.

```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/api/storage/upload-temp', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!data.success) throw new Error(data.message);

  return {
    fileId: data.data.fileId,
    downloadUrl: data.data.downloadUrl,
    expiresAt: new Date(data.data.expiresAt) // JS Date object
  };
}

// Usage
const { fileId, downloadUrl, expiresAt } = await uploadFile(myFile);
console.log(`File expires at: ${expiresAt.toLocaleTimeString()}`);
console.log(`Download: ${downloadUrl}`);
```

### Show expiry countdown

```javascript
function ExpiryTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(expiresAt) - Date.now();
      if (ms <= 0) {
        setRemaining('Expired');
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span>File expires in: {remaining}</span>;
}
```

---

## Watermark — Text + Image

```javascript
// Text watermark
async function addTextWatermark(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('text', options.text || 'CONFIDENTIAL');
  formData.append('opacity', String(options.opacity ?? 0.3));
  formData.append('rotation', String(options.rotation ?? 45));
  formData.append('fontSize', String(options.fontSize ?? 48));

  if (options.pages?.length) {
    formData.append('pages', JSON.stringify(options.pages)); // "[1,2,3]"
  }

  const response = await fetch('http://localhost:3000/api/pdf/watermark', {
    method: 'POST',
    body: formData
  });

  const blob = await response.blob();
  downloadBlob(blob, 'watermarked.pdf');
}

// Image watermark
async function addImageWatermark(pdfFile, imageFile, opacity = 0.3) {
  const formData = new FormData();
  formData.append('file', pdfFile);
  formData.append('watermarkImage', imageFile); // PNG or JPEG
  formData.append('opacity', String(opacity));

  const response = await fetch('http://localhost:3000/api/pdf/watermark', {
    method: 'POST',
    body: formData
  });

  const blob = await response.blob();
  downloadBlob(blob, 'watermarked.pdf');
}
```

---

## PDF to Image (Multi-Page Handling)

When a PDF has multiple pages, the API returns a JSON list of filenames instead of a single image.

```javascript
async function pdfToImages(file, format = 'png', dpi = 150) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  formData.append('dpi', String(dpi));

  const response = await fetch('http://localhost:3000/api/convert/pdf-to-image', {
    method: 'POST',
    body: formData
  });

  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    // Multi-page PDF — returns list of filenames
    const data = await response.json();
    console.log(`${data.data.pageCount} pages converted`);
    // data.data.files = [{ page: 1, filename: "pdf-img-uuid-001.png" }, ...]
    return data.data;
  }

  // Single-page PDF — returns image directly
  const blob = await response.blob();
  downloadBlob(blob, `page-1.${format}`);
  return null;
}
```

---

## Rate Limit Handling

When you hit a rate limit, the API returns `429`. Always handle this gracefully.

```javascript
async function callWithRetry(endpoint, formData, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      if (attempt < maxRetries) {
        console.log(`Rate limited. Retrying in ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    return response;
  }
}
```

---

## Service Unavailable (503)

When a downstream service is down, the gateway returns 503 with a JSON body.

```javascript
async function safePDFCall(endpoint, formData) {
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    method: 'POST',
    body: formData
  });

  if (response.status === 503) {
    throw new Error('PDF service is temporarily unavailable. Please try again in a moment.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(err.message);
  }

  return response;
}
```

---

## Check File Expiry Before Download

```javascript
async function getFileInfo(fileId) {
  const response = await fetch(`http://localhost:3000/api/storage/temp/${fileId}`);

  if (response.status === 410) {
    throw new Error('This file has expired. Please upload again.');
  }

  if (response.status === 404) {
    throw new Error('File not found.');
  }

  const data = await response.json();
  return data.data;
}

async function downloadFile(fileId, filename) {
  const info = await getFileInfo(fileId);

  // Check if about to expire (less than 5 minutes left)
  const expiresAt = new Date(info.expiresAt);
  const minsLeft = (expiresAt - Date.now()) / 60000;

  if (minsLeft < 5) {
    console.warn(`Warning: file expires in ${Math.round(minsLeft)} minutes`);
  }

  const response = await fetch(info.downloadUrl);
  const blob = await response.blob();
  downloadBlob(blob, filename || info.originalName);
}
```

---

## Vue 3 Composable Example

```javascript
// composables/usePDFKit.js
import { ref } from 'vue';

export function usePDFKit() {
  const loading = ref(false);
  const error = ref(null);

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function merge(files) {
    loading.value = true;
    error.value = null;
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await fetch('http://localhost:3000/api/pdf/merge', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).message);
      downloadBlob(await res.blob(), 'merged.pdf');
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function compress(file, quality = 'ebook') {
    loading.value = true;
    error.value = null;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('quality', quality);
      const res = await fetch('http://localhost:3000/api/convert/compress', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).message);
      downloadBlob(await res.blob(), 'compressed.pdf');
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, merge, compress };
}
```

---

## TypeScript Types

```typescript
// types/pdfkit.ts

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

export type WatermarkOptions = {
  text?: string;
  opacity?: number;    // 0.0–1.0
  rotation?: number;   // degrees
  pages?: number[];    // 1-indexed, empty = all
  fontSize?: number;
};
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Setting `Content-Type: multipart/form-data` manually | Don't — let the browser/axios set it with the boundary |
| Expecting JSON from PDF operations | Response is binary blob, not JSON |
| Not setting `responseType: 'blob'` in axios | Axios will try to parse binary as text |
| Sending `pages` as a JS array directly | Must be a JSON string: `JSON.stringify([1,2,3])` |
| Not handling 410 (expired file) | Files expire after 1 hour — always handle this |
| Using `Authorization` header | Not needed — all operations are public |
