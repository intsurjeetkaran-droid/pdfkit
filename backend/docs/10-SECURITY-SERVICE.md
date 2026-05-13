# Security Service

**Port:** 3008  
**Version:** 2.0.0  
**No auth required**  
**Tests:** ✅ 21/21 passing

---

## Overview

Handles PDF password protection and metadata removal. Uses `qpdf` for encryption/decryption and `pdf-lib` for metadata stripping.

---

## System Dependencies

| Tool | Used for |
|------|---------|
| `qpdf` (v12+) | protect (AES-256 encrypt), unlock (decrypt) |
| `pdf-lib` (npm) | remove-metadata (in-process, no external tool) |

---

## Error Handling

All qpdf errors are mapped to clean **400** responses via `classifyQpdfError()`:

| qpdf error | Response |
|-----------|---------|
| Wrong password | `"Incorrect password. Cannot unlock this PDF."` |
| File not encrypted | `"This PDF is not password-protected. Nothing to unlock."` |
| Damaged / not a PDF | `"Invalid or corrupt PDF: qpdf could not process this file."` |
| Already encrypted | `"This PDF is already password-protected."` |

---

## Routes

### POST /api/security/protect

Add AES-256 password protection to a PDF.

**Request**
```
Content-Type: multipart/form-data
Field: file           (PDF, required)
Field: userPassword   (string, required) — password to open the PDF
Field: ownerPassword  (string, optional) — password to change permissions
                      defaults to userPassword if not provided
```

**Response** `200 OK`
```
Content-Disposition: attachment; filename="protected.pdf"
Content-Type: application/pdf
[binary encrypted PDF]
```

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "userPassword is required" }
400: { "success": false, "message": "Only PDF files are accepted. Got: image/png" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
400: { "success": false, "message": "PDF security operation failed. The file may be corrupt or unsupported." }
```

**Typical time:** 500ms – 3s

---

### POST /api/security/unlock

Remove password from a PDF. Requires the current password.

**Request**
```
Content-Type: multipart/form-data
Field: file      (PDF, required) — password-protected PDF
Field: password  (string, required) — current password to decrypt
```

**Response** `200 OK`
```
Content-Disposition: attachment; filename="unlocked.pdf"
Content-Type: application/pdf
[binary decrypted PDF]
```

**Note:** If the PDF is not password-protected, qpdf copies it as-is and returns 200. This is correct qpdf behavior — decrypting a non-encrypted file is a no-op.

**Errors**
```json
400: { "success": false, "message": "password is required to unlock the PDF" }
400: { "success": false, "message": "Incorrect password. Cannot unlock this PDF." }
400: { "success": false, "message": "Invalid or corrupt PDF: qpdf could not process this file." }
```

**Typical time:** 500ms – 3s

---

### POST /api/security/remove-metadata

Strip all embedded metadata from a PDF. Pure in-process operation using pdf-lib.

**Removes:**
- Title, Author, Subject, Keywords
- Creator, Producer
- CreationDate, ModificationDate
- XMP metadata stream

**Request**
```
Content-Type: multipart/form-data
Field: file  (PDF, required)
```

**Response** `200 OK`
```
Content-Disposition: attachment; filename="no-metadata.pdf"
Content-Type: application/pdf
[binary PDF with metadata stripped]
```

**Errors**
```json
400: { "success": false, "message": "PDF file is required" }
400: { "success": false, "message": "Invalid or corrupt PDF: ..." }
400: { "success": false, "message": "Failed to process PDF: ..." }
```

**Typical time:** 100ms – 1s

---

## Upload Limits

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Allowed MIME | `application/pdf` only |
| Field name | Must be `"file"` |
