# Storage Service

**Port:** 3003  
**Version:** 2.0.0  
**No auth required**  
**Tests:** ✅ 40/40 passing

---

## Overview

Guest-first file storage with automatic TTL cleanup. All uploads are anonymous — no user ID, no token. Files expire after 1 hour and are automatically deleted.

---

## File Lifecycle

```
Upload → stored in /storage/temp/
       → DB record: { id, path, expiresAt = now + 1h }
       → returns { fileId, downloadUrl, expiresAt }
       → downloadUrl = http://localhost:3000/api/storage/temp/:id/download
         (points to API Gateway, usable from outside Docker)

Download → stream from disk (memory-safe for 100MB files)

Auto-cleanup → every hour, scheduler deletes files where expiresAt < now
             → BullMQ cleanup-jobs worker handles bulk deletions
```

---

## Directory Structure

```
storage/
  temp/       ← uploaded guest files (TTL: 1 hour)
  processed/  ← processed output files (TTL: 1 hour)
  cache/      ← reserved for future use
```

---

## Routes

### POST /api/storage/upload-temp

Upload a file anonymously. No auth required.

**Request**
```
Content-Type: multipart/form-data
Field name: "file"   ← must be exactly "file"
```

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "downloadUrl": "http://localhost:3000/api/storage/temp/550e8400.../download",
    "expiresAt": "2026-05-13T11:00:00.000Z"
  }
}
```

**Errors**
```json
400: { "success": false, "message": "No file provided. Use field name \"file\"." }
400: { "success": false, "message": "File is empty (0 bytes)" }
400: { "success": false, "message": "File type not allowed: text/plain" }
400: { "success": false, "message": "Unexpected field. Use \"file\" as the field name" }
400: { "success": false, "message": "File too large. Maximum size is 100MB" }
```

---

### GET /api/storage/temp/:id

Get file metadata.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "isTemporary": true,
    "expiresAt": "2026-05-13T11:00:00.000Z",
    "downloadUrl": "http://localhost:3000/api/storage/temp/550e8400.../download",
    "createdAt": "2026-05-13T10:00:00.000Z"
  }
}
```

**Errors**
```json
404: { "success": false, "message": "File not found" }
410: { "success": false, "message": "File has expired and is no longer available" }
```

---

### GET /api/storage/temp/:id/download

Stream file download.

**Response** `200 OK`
```
Content-Disposition: attachment; filename="document.pdf"
Content-Type: application/pdf
Content-Length: 102400
[binary file stream]
```

**Errors**
```json
404: { "success": false, "message": "File not found on disk" }
410: { "success": false, "message": "File has expired and is no longer available" }
```

---

### DELETE /api/storage/temp/:id

Delete a file immediately (before TTL expiry).

**Response** `200 OK`
```json
{ "success": true, "message": "File deleted successfully" }
```

**Errors**
```json
404: { "success": false, "message": "File not found" }
```

---

### GET /api/storage/stats

Storage statistics.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalFiles": 42,
    "tempFiles": 38,
    "totalSizeBytes": 10485760,
    "totalSizeMB": 10.0,
    "diskUsage": {
      "tempDirBytes": 8388608,
      "processedDirBytes": 2097152
    }
  }
}
```

---

### POST /api/storage/cleanup

Manually trigger deletion of all expired files.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Cleanup completed",
  "data": { "deletedCount": 12 }
}
```

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Allowed MIME types | PDF, PNG, JPEG, WebP, TIFF, BMP, DOCX, DOC, XLSX, XLS, PPTX, PPT |
| Field name | Must be `"file"` |

---

## TTL Configuration

```env
FILE_TTL_MS=3600000          # 1 hour (default)
CLEANUP_INTERVAL_MS=3600000  # run cleanup every 1 hour
STORAGE_BASE_URL=http://localhost:3000  # base URL for downloadUrl
```

---

## Filename Sanitization

- Special characters replaced with `_`
- Filename truncated to 200 characters
- Extension capped at 10 characters
- Path traversal sequences (`../`) sanitized
- XSS characters (`<>`) sanitized
