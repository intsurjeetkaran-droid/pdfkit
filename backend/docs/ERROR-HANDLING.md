# Error Handling Guide

**PDFKit v2.0 — For Frontend Developers**

---

## Error Response Shape

All errors return JSON (even when the success response would be binary):

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong"
}
```

---

## HTTP Status Codes

| Code | When it happens | What to show the user |
|------|----------------|----------------------|
| `400` | Bad request — missing field, wrong type, invalid params | Show `message` directly |
| `404` | File or route not found | "File not found" |
| `410` | File expired (TTL elapsed) | "This file has expired. Please upload again." |
| `413` | File too large (> 100MB) | "File is too large. Maximum size is 100MB." |
| `429` | Rate limit exceeded | "Too many requests. Please wait a moment." |
| `500` | Internal server error | "Something went wrong. Please try again." |
| `503` | Downstream service unavailable | "Service temporarily unavailable. Please try again." |

---

## Handling Errors in Fetch

```javascript
async function callAPI(endpoint, formData) {
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    method: 'POST',
    body: formData
  });

  // Binary success responses (PDF, image, DOCX)
  if (response.ok) {
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return response.blob(); // binary file
    }
    return response.json(); // JSON success (e.g. upload-temp, pdf-to-image multi-page)
  }

  // All errors are JSON
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: `HTTP ${response.status}` };
  }

  // Handle specific status codes
  switch (response.status) {
    case 400:
      throw new Error(errorData.message); // show to user directly

    case 404:
      throw new Error('File not found.');

    case 410:
      throw new Error('This file has expired. Please upload it again.');

    case 413:
      throw new Error('File is too large. Maximum size is 100MB.');

    case 429: {
      const retryAfter = response.headers.get('Retry-After');
      const msg = retryAfter
        ? `Too many requests. Please wait ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      throw new Error(msg);
    }

    case 503:
      throw new Error('Service temporarily unavailable. Please try again in a moment.');

    default:
      throw new Error(errorData.message || 'Something went wrong. Please try again.');
  }
}
```

---

## Handling Errors in Axios

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000', timeout: 120000 });

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — service unreachable
      throw new Error('Cannot connect to server. Check your internet connection.');
    }

    const { status, data } = error.response;

    switch (status) {
      case 400: throw new Error(data?.message || 'Invalid request.');
      case 404: throw new Error('File not found.');
      case 410: throw new Error('This file has expired. Please upload it again.');
      case 413: throw new Error('File is too large. Maximum size is 100MB.');
      case 429: throw new Error('Too many requests. Please wait a moment.');
      case 503: throw new Error('Service temporarily unavailable. Please try again.');
      default:  throw new Error(data?.message || 'Something went wrong.');
    }
  }
);
```

---

## Specific Error Scenarios

### File expired (410)

Files are deleted after 1 hour. Always handle this when using stored fileIds.

```javascript
async function safeDownload(fileId) {
  try {
    const response = await fetch(`http://localhost:3000/api/storage/temp/${fileId}`);

    if (response.status === 410) {
      // File is gone — ask user to re-upload
      showMessage('This file has expired. Please upload your file again.');
      return;
    }

    if (!response.ok) throw new Error('Download failed');

    const data = await response.json();
    window.location.href = data.data.downloadUrl;
  } catch (err) {
    showMessage(err.message);
  }
}
```

### Rate limit (429)

```javascript
async function callWithBackoff(endpoint, formData) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (response.status !== 429) return response;

    if (attempt === maxAttempts) {
      throw new Error('Rate limit exceeded. Please try again in an hour.');
    }

    // Wait before retrying (exponential backoff)
    const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
    await new Promise(r => setTimeout(r, waitMs));
  }
}
```

### Service unavailable (503)

```javascript
async function callWithFallback(endpoint, formData) {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (response.status === 503) {
      // Show user-friendly message with retry option
      showRetryDialog('The PDF service is temporarily unavailable.');
      return null;
    }

    return response;
  } catch (err) {
    // Network error
    showMessage('Cannot reach the server. Please check your connection.');
    return null;
  }
}
```

### File too large (413)

```javascript
// Validate file size before uploading
function validateFileSize(file, maxMB = 100) {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is ${maxMB}MB.`);
  }
}

// Usage
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  try {
    files.forEach(f => validateFileSize(f));
    // proceed with upload
  } catch (err) {
    showError(err.message);
    event.target.value = ''; // clear the input
  }
}
```

### Wrong file type

```javascript
const ALLOWED_PDF_MIME = ['application/pdf'];
const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/tiff', 'image/bmp'];
const ALLOWED_OFFICE_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
];

function validateMimeType(file, allowed) {
  if (!allowed.includes(file.type)) {
    throw new Error(`"${file.name}" is not a supported file type.`);
  }
}
```

---

## React Error Boundary for PDF Operations

```jsx
import { useState } from 'react';

function PDFOperationWrapper({ children }) {
  const [error, setError] = useState(null);

  const handleError = (err) => {
    setError(err.message);
    // Auto-clear after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div>
      {error && (
        <div className="error-banner" role="alert">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {/* Pass handleError down to child components */}
      {children({ onError: handleError })}
    </div>
  );
}
```

---

## Error Messages Reference

| Scenario | Message from API |
|----------|-----------------|
| No file provided | `"No file provided. Use field name \"file\"."` |
| Wrong field name | `"Unexpected field. Use \"file\" as the field name"` |
| Wrong file type (PDF ops) | `"Only PDF files are allowed"` |
| Wrong file type (conversion) | `"Expected image (PNG/JPEG/WebP/TIFF/BMP) file, got: application/pdf"` |
| Wrong file type (compress) | `"Expected PDF file, got: image/png"` |
| File too large | `"File too large. Maximum size is 100MB"` |
| Empty file (0 bytes) | `"File is empty (0 bytes)"` |
| Corrupt/invalid PDF | `"Invalid or corrupt PDF: Failed to parse PDF document"` |
| Merge needs 2+ files | `"At least 2 PDF files are required"` |
| Invalid pages array | `"pages must be a JSON array of integers"` |
| Page out of range | `"No valid page numbers. PDF has 3 pages."` |
| Invalid angle | `"angle must be 90, 180, or 270"` |
| Delete all pages | `"Cannot delete all pages from a PDF"` |
| Remove all pages | `"Cannot remove all pages from a PDF"` |
| Invalid watermark | `"Either text or watermarkImage is required"` |
| File not found | `"File not found"` |
| File expired | `"File has expired and is no longer available"` |
| Rate limited (general) | `"Too many requests. Please try again later."` |
| Rate limited (upload) | `"Upload limit reached. Please try again later."` |
| Rate limited (heavy ops) | `"Heavy operation limit reached. Please try again in an hour."` |
| Service down | `"pdf-service is currently unavailable. Please try again."` |
| Queue: retry non-failed job | `"Job 42 is in \"completed\" state. Only failed jobs can be retried."` |
| Queue: unknown queue | `"Unknown queue: bad-queue. Valid queues: pdf-jobs, ..."` |
| Queue: missing fields | `"queue, name, and data are required"` |
