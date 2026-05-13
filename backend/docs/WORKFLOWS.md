# Workflows Guide

**PDFKit v2.0 — Common Frontend Workflows**

---

## Workflow 1: Direct Process & Download

The simplest pattern. Upload + process in one request. Response is the file.

```
User picks file → POST to operation → browser downloads result
```

```javascript
// Works for: merge, split, rotate, extract, delete-pages, reorder,
//            watermark, image-to-pdf, word-to-pdf, compress, etc.

async function processAndDownload(file, endpoint, fields = {}, outputName) {
  const formData = new FormData();
  formData.append('file', file);

  // Add any extra fields (pages, angle, quality, etc.)
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  const response = await fetch(`http://localhost:3000${endpoint}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputName;
  a.click();
  URL.revokeObjectURL(url);
}

// Examples
await processAndDownload(file, '/api/pdf/split',   { pages: [1, 3] }, 'split.pdf');
await processAndDownload(file, '/api/pdf/rotate',  { pages: [], angle: 90 }, 'rotated.pdf');
await processAndDownload(file, '/api/convert/compress', { quality: 'ebook' }, 'compressed.pdf');
```

---

## Workflow 2: Upload → Store → Share Download Link

Upload a file, get a persistent (1-hour) download URL to share or use later.

```
User picks file → POST /api/storage/upload-temp → get fileId + downloadUrl
               → share downloadUrl or use fileId for later operations
```

```javascript
async function uploadAndGetLink(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/api/storage/upload-temp', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.message);

  const { fileId, downloadUrl, expiresAt } = data.data;

  // Show the user their download link + expiry time
  return {
    fileId,
    downloadUrl,
    expiresAt: new Date(expiresAt),
    minutesLeft: Math.round((new Date(expiresAt) - Date.now()) / 60000)
  };
}

// Usage
const { downloadUrl, minutesLeft } = await uploadAndGetLink(myFile);
console.log(`Download: ${downloadUrl}`);
console.log(`Available for ${minutesLeft} minutes`);
```

---

## Workflow 3: Merge Multiple PDFs

```
User picks 2+ files → POST /api/pdf/merge → browser downloads merged.pdf
```

```javascript
async function mergePDFs(files) {
  if (files.length < 2) throw new Error('Select at least 2 PDF files');
  if (files.length > 20) throw new Error('Maximum 20 files per merge');

  const formData = new FormData();
  // All files use the same field name "files"
  files.forEach(file => formData.append('files', file));

  const response = await fetch('http://localhost:3000/api/pdf/merge', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const blob = await response.blob();
  downloadBlob(blob, 'merged.pdf');
}
```

---

## Workflow 4: PDF to Images (Multi-Page)

Multi-page PDFs return a JSON list of filenames, not a single image.

```
User picks PDF → POST /api/convert/pdf-to-image
              → single page: image downloaded directly
              → multi-page: JSON with filenames list
```

```javascript
async function convertPDFToImages(file, format = 'png', dpi = 150) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  formData.append('dpi', String(dpi));

  const response = await fetch('http://localhost:3000/api/convert/pdf-to-image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    // Multi-page: show list of pages to user
    const data = await response.json();
    return {
      type: 'multi',
      pageCount: data.data.pageCount,
      pages: data.data.files // [{ page: 1, filename: "..." }, ...]
    };
  }

  // Single page: download directly
  const blob = await response.blob();
  downloadBlob(blob, `page-1.${format}`);
  return { type: 'single' };
}
```

---

## Workflow 5: Watermark with Live Preview Options

```javascript
async function addWatermark(pdfFile, options) {
  const formData = new FormData();
  formData.append('file', pdfFile);

  if (options.type === 'text') {
    formData.append('text', options.text);
    formData.append('opacity', String(options.opacity ?? 0.3));
    formData.append('rotation', String(options.rotation ?? 45));
    formData.append('fontSize', String(options.fontSize ?? 48));
  } else if (options.type === 'image') {
    formData.append('watermarkImage', options.imageFile);
    formData.append('opacity', String(options.opacity ?? 0.3));
    formData.append('rotation', String(options.rotation ?? 0));
  }

  // Apply to specific pages only (optional)
  if (options.pages?.length) {
    formData.append('pages', JSON.stringify(options.pages));
  }

  const response = await fetch('http://localhost:3000/api/pdf/watermark', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const blob = await response.blob();
  downloadBlob(blob, 'watermarked.pdf');
}

// Usage examples
await addWatermark(file, { type: 'text', text: 'DRAFT', opacity: 0.2, rotation: 45 });
await addWatermark(file, { type: 'text', text: 'CONFIDENTIAL', pages: [1, 2, 3] });
await addWatermark(file, { type: 'image', imageFile: logoFile, opacity: 0.15 });
```

---

## Workflow 6: Reorder Pages (Drag & Drop UI)

```javascript
// User drags pages into new order in your UI
// pageOrder is an array of 1-indexed page numbers in the new order
// e.g. [3, 1, 2] means: show page 3 first, then 1, then 2

async function reorderPages(pdfFile, pageOrder) {
  const formData = new FormData();
  formData.append('file', pdfFile);
  formData.append('order', JSON.stringify(pageOrder)); // "[3,1,2]"

  const response = await fetch('http://localhost:3000/api/pdf/reorder', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const blob = await response.blob();
  downloadBlob(blob, 'reordered.pdf');
}

// Example: user has 5-page PDF and drags to new order
await reorderPages(file, [5, 3, 1, 2, 4]);
```

---

## Workflow 7: Poll Job Status (Async Processing)

For long-running operations submitted via the queue API.

```javascript
async function submitJobAndPoll(queueName, jobName, jobData) {
  // 1. Submit the job
  const submitResponse = await fetch('http://localhost:3000/api/queue/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue: queueName, name: jobName, data: jobData })
  });

  const submitData = await submitResponse.json();
  if (!submitData.success) throw new Error(submitData.message);

  const { jobId, queue } = submitData.data;
  console.log(`Job ${jobId} submitted to ${queue}`);

  // 2. Poll until complete
  return pollJobStatus(queue, jobId);
}

async function pollJobStatus(queue, jobId, intervalMs = 1000, maxWaitMs = 120000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`http://localhost:3000/api/queue/jobs/${queue}/${jobId}`);
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    const { state, progress, returnvalue, failedReason } = data.data;

    console.log(`Job ${jobId}: ${state} (${progress}%)`);

    if (state === 'completed') return returnvalue;
    if (state === 'failed') throw new Error(failedReason || 'Job failed');

    // Wait before next poll
    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Job timed out');
}

// React hook for job polling
function useJobPoller(queue, jobId) {
  const [state, setState] = useState('waiting');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/queue/jobs/${queue}/${jobId}`);
        const data = await res.json();

        setState(data.data.state);
        setProgress(data.data.progress);

        if (data.data.state === 'completed') {
          setResult(data.data.returnvalue);
          clearInterval(interval);
        }
        if (data.data.state === 'failed') {
          setError(data.data.failedReason);
          clearInterval(interval);
        }
      } catch (err) {
        setError(err.message);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [queue, jobId]);

  return { state, progress, result, error };
}
```

---

## Workflow 8: Compress with Size Comparison

```javascript
async function compressWithStats(file, quality = 'ebook') {
  const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('quality', quality);

  const response = await fetch('http://localhost:3000/api/convert/compress', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message);
  }

  const blob = await response.blob();
  const compressedSizeMB = (blob.size / 1024 / 1024).toFixed(2);
  const reductionPct = Math.round((1 - blob.size / file.size) * 100);

  console.log(`Original: ${originalSizeMB}MB → Compressed: ${compressedSizeMB}MB (${reductionPct}% smaller)`);

  downloadBlob(blob, 'compressed.pdf');

  return { originalSizeMB, compressedSizeMB, reductionPct };
}
```

---

## Workflow 9: Delete File After Download

Clean up immediately after the user downloads, rather than waiting for TTL.

```javascript
async function downloadAndCleanup(fileId, filename) {
  // 1. Download
  const response = await fetch(`http://localhost:3000/api/storage/temp/${fileId}/download`);

  if (!response.ok) {
    if (response.status === 410) throw new Error('File has expired.');
    throw new Error('Download failed.');
  }

  const blob = await response.blob();
  downloadBlob(blob, filename);

  // 2. Delete immediately (fire and forget)
  fetch(`http://localhost:3000/api/storage/temp/${fileId}`, { method: 'DELETE' })
    .catch(() => {}); // ignore errors — TTL will clean it up anyway
}
```

---

## Helper: downloadBlob

Used in all workflows above:

```javascript
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
