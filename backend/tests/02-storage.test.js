/**
 * tests/02-storage.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Storage Service — complete test coverage
 *
 * Happy path:
 *   upload-temp → get info → download → delete
 *   upload multiple types (PDF, PNG)
 *   stats endpoint
 *   cleanup endpoint
 *
 * Edge cases:
 *   upload with no file → 400
 *   upload wrong MIME type → 400
 *   get non-existent file → 404
 *   download non-existent file → 404
 *   delete non-existent file → 404
 *   delete already-deleted file → 404
 *   get file after delete → 404
 *   response shape validation (fileId, downloadUrl, expiresAt, mimeType, size)
 *   expiresAt is ~1 hour in the future
 *   downloadUrl is a valid URL
 *   download returns correct Content-Type header
 *   download returns correct Content-Disposition header
 *   no auth header required (guest-first)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  get, del, postForm,
  makePDF, makePNG, makeTXT,
  isPDFBuffer, C
} = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
async function testUploadTemp() {
  section('Storage — POST /api/storage/upload-temp');

  let fileId = null;

  // Happy path: upload a PDF
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: makePDF() }
    ]);

    if (res.status === 201 && res.json?.success && res.json?.data?.fileId) {
      fileId = res.json.data.fileId;
      pass('Upload PDF → 201', `fileId: ${fileId}`);

      // Validate response shape
      const d = res.json.data;
      d.fileId       ? pass('  → fileId present')       : fail('  → fileId missing');
      d.originalName ? pass('  → originalName present', d.originalName) : fail('  → originalName missing');
      d.mimeType     ? pass('  → mimeType present', d.mimeType)         : fail('  → mimeType missing');
      d.size > 0     ? pass('  → size > 0', `${d.size} bytes`)          : fail('  → size is 0 or missing');
      d.downloadUrl  ? pass('  → downloadUrl present')  : fail('  → downloadUrl missing');
      d.expiresAt    ? pass('  → expiresAt present')    : fail('  → expiresAt missing');

      // expiresAt should be ~1 hour in the future (between 55 and 65 minutes)
      if (d.expiresAt) {
        const minsLeft = (new Date(d.expiresAt) - Date.now()) / 60000;
        (minsLeft > 55 && minsLeft < 65)
          ? pass('  → expiresAt is ~1 hour from now', `${minsLeft.toFixed(1)} min`)
          : fail('  → expiresAt wrong TTL', `${minsLeft.toFixed(1)} min (expected ~60)`);
      }

      // downloadUrl should be a valid URL
      if (d.downloadUrl) {
        try {
          new URL(d.downloadUrl);
          pass('  → downloadUrl is a valid URL', d.downloadUrl);
        } catch {
          fail('  → downloadUrl is not a valid URL', d.downloadUrl);
        }
      }

      // mimeType should match what we uploaded
      d.mimeType === 'application/pdf'
        ? pass('  → mimeType matches uploaded file')
        : fail('  → mimeType mismatch', `got ${d.mimeType}`);

    } else {
      fail('Upload PDF → 201', `status ${res.status}: ${res.raw.slice(0, 120)}`);
    }
  } catch (e) {
    fail('Upload PDF → 201', e.message);
  }

  // Upload a PNG
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'image.png', mime: 'image/png', data: makePNG() }
    ]);
    res.status === 201 && res.json?.data?.fileId
      ? pass('Upload PNG → 201', `mimeType: ${res.json.data.mimeType}`)
      : fail('Upload PNG → 201', `status ${res.status}`);
  } catch (e) {
    fail('Upload PNG → 201', e.message);
  }

  // No auth header required
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'noauth.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    res.status === 201
      ? pass('Upload works with NO auth header (guest-first)')
      : fail('Upload without auth', `status ${res.status}`);
  } catch (e) {
    fail('Upload without auth', e.message);
  }

  return fileId;
}

// ─────────────────────────────────────────────────────────────────────────────
async function testGetFileInfo(fileId) {
  section('Storage — GET /api/storage/temp/:id');

  if (!fileId) { skip('GET file info', 'no fileId from upload'); return; }

  // Happy path
  try {
    const res = await get(`/api/storage/temp/${fileId}`);
    if (res.status === 200 && res.json?.data?.fileId === fileId) {
      pass('GET /api/storage/temp/:id → 200');
      const d = res.json.data;
      d.isTemporary === true ? pass('  → isTemporary = true') : fail('  → isTemporary should be true');
      d.expiresAt           ? pass('  → expiresAt present')   : fail('  → expiresAt missing');
      d.createdAt           ? pass('  → createdAt present')   : fail('  → createdAt missing');
      d.downloadUrl         ? pass('  → downloadUrl present') : fail('  → downloadUrl missing');
    } else {
      fail('GET /api/storage/temp/:id → 200', `status ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/storage/temp/:id', e.message);
  }

  // Non-existent ID → 404
  try {
    const res = await get('/api/storage/temp/00000000-0000-0000-0000-000000000000');
    res.status === 404
      ? pass('GET non-existent file → 404')
      : fail('GET non-existent file', `expected 404, got ${res.status}`);
  } catch (e) {
    fail('GET non-existent file → 404', e.message);
  }

  // Malformed ID → 404 or 400
  try {
    const res = await get('/api/storage/temp/not-a-valid-uuid-at-all');
    (res.status === 404 || res.status === 400)
      ? pass('GET malformed ID → 404/400', `got ${res.status}`)
      : fail('GET malformed ID', `expected 404/400, got ${res.status}`);
  } catch (e) {
    fail('GET malformed ID', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testDownload(fileId) {
  section('Storage — GET /api/storage/temp/:id/download');

  if (!fileId) { skip('Download file', 'no fileId from upload'); return; }

  // Happy path
  try {
    const res = await get(`/api/storage/temp/${fileId}/download`);
    if (res.status === 200) {
      pass('GET /api/storage/temp/:id/download → 200', `${res.buffer.length} bytes`);

      // Content-Type header
      const ct = res.headers['content-type'] || '';
      ct.includes('application/pdf')
        ? pass('  → Content-Type: application/pdf')
        : fail('  → Content-Type wrong', `got: ${ct}`);

      // Content-Disposition header
      const cd = res.headers['content-disposition'] || '';
      cd.includes('attachment')
        ? pass('  → Content-Disposition: attachment')
        : fail('  → Content-Disposition missing or wrong', `got: ${cd}`);

      // Content-Length header
      res.headers['content-length']
        ? pass('  → Content-Length header present', res.headers['content-length'])
        : fail('  → Content-Length header missing');

      // Response body is a real PDF
      isPDFBuffer(res.buffer)
        ? pass('  → Response body starts with %PDF (valid PDF)')
        : fail('  → Response body is not a PDF');

    } else {
      fail('GET download → 200', `status ${res.status}: ${res.raw.slice(0, 80)}`);
    }
  } catch (e) {
    fail('GET download', e.message);
  }

  // Download non-existent → 404
  try {
    const res = await get('/api/storage/temp/00000000-0000-0000-0000-000000000000/download');
    res.status === 404
      ? pass('Download non-existent → 404')
      : fail('Download non-existent', `expected 404, got ${res.status}`);
  } catch (e) {
    fail('Download non-existent → 404', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testDelete(fileId) {
  section('Storage — DELETE /api/storage/temp/:id');

  if (!fileId) { skip('Delete file', 'no fileId from upload'); return; }

  // Happy path
  try {
    const res = await del(`/api/storage/temp/${fileId}`);
    res.status === 200 && res.json?.success
      ? pass('DELETE /api/storage/temp/:id → 200')
      : fail('DELETE file', `status ${res.status}`);
  } catch (e) {
    fail('DELETE file', e.message);
  }

  // Get after delete → 404
  try {
    const res = await get(`/api/storage/temp/${fileId}`);
    res.status === 404
      ? pass('GET after delete → 404 (file gone)')
      : fail('GET after delete', `expected 404, got ${res.status}`);
  } catch (e) {
    fail('GET after delete → 404', e.message);
  }

  // Delete again → 404
  try {
    const res = await del(`/api/storage/temp/${fileId}`);
    res.status === 404
      ? pass('DELETE already-deleted → 404')
      : fail('DELETE already-deleted', `expected 404, got ${res.status}`);
  } catch (e) {
    fail('DELETE already-deleted → 404', e.message);
  }

  // Delete non-existent → 404
  try {
    const res = await del('/api/storage/temp/00000000-0000-0000-0000-000000000000');
    res.status === 404
      ? pass('DELETE non-existent → 404')
      : fail('DELETE non-existent', `expected 404, got ${res.status}`);
  } catch (e) {
    fail('DELETE non-existent → 404', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testUploadEdgeCases() {
  section('Storage — Upload Edge Cases');

  // No file field → 400
  try {
    const res = await postForm('/api/storage/upload-temp', {}, []);
    res.status === 400
      ? pass('Upload with no file → 400')
      : fail('Upload with no file', `expected 400, got ${res.status}`);
  } catch (e) {
    fail('Upload with no file → 400', e.message);
  }

  // Wrong MIME type (plain text) → 400
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'bad.txt', mime: 'text/plain', data: makeTXT() }
    ]);
    res.status === 400
      ? pass('Upload wrong MIME type (text/plain) → 400')
      : fail('Upload wrong MIME type', `expected 400, got ${res.status}`);
  } catch (e) {
    fail('Upload wrong MIME type → 400', e.message);
  }

  // Wrong field name (should be "file") → 400 or 500 (multer rejects unexpected fields)
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'document', filename: 'test.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    (res.status === 400 || res.status === 500)
      ? pass('Upload wrong field name → 400/500 (multer rejects)', `got ${res.status}`)
      : fail('Upload wrong field name', `expected 400/500, got ${res.status}`);
  } catch (e) {
    fail('Upload wrong field name → 400/500', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testStats() {
  section('Storage — GET /api/storage/stats');

  try {
    const res = await get('/api/storage/stats');
    if (res.status === 200 && res.json?.success) {
      pass('GET /api/storage/stats → 200');
      const d = res.json.data;
      typeof d.totalFiles === 'number'   ? pass('  → totalFiles is a number', String(d.totalFiles))   : fail('  → totalFiles missing');
      typeof d.tempFiles === 'number'    ? pass('  → tempFiles is a number', String(d.tempFiles))     : fail('  → tempFiles missing');
      typeof d.totalSizeBytes === 'number' ? pass('  → totalSizeBytes present') : fail('  → totalSizeBytes missing');
      typeof d.totalSizeMB === 'number'  ? pass('  → totalSizeMB present', `${d.totalSizeMB} MB`)    : fail('  → totalSizeMB missing');
      d.diskUsage                        ? pass('  → diskUsage object present') : fail('  → diskUsage missing');
    } else {
      fail('GET /api/storage/stats → 200', `status ${res.status}`);
    }
  } catch (e) {
    fail('GET /api/storage/stats', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testCleanup() {
  section('Storage — POST /api/storage/cleanup');

  try {
    const res = await postForm('/api/storage/cleanup', {}, []);
    if (res.status === 200 && res.json?.success) {
      pass('POST /api/storage/cleanup → 200');
      typeof res.json.data?.deletedCount === 'number'
        ? pass('  → deletedCount is a number', String(res.json.data.deletedCount))
        : fail('  → deletedCount missing');
    } else {
      fail('POST /api/storage/cleanup → 200', `status ${res.status}`);
    }
  } catch (e) {
    fail('POST /api/storage/cleanup', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ STORAGE SERVICE${C.reset}`);

  const fileId = await testUploadTemp();
  await testGetFileInfo(fileId);
  await testDownload(fileId);
  await testDelete(fileId);
  await testUploadEdgeCases();
  await testStats();
  await testCleanup();
};
