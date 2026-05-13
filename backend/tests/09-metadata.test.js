/**
 * tests/09-metadata.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Metadata Service — complete test coverage
 *
 * Happy path:
 *   info       — full metadata extraction (pageCount, dimensions, title, etc.)
 *   page-count — fast page count only
 *   preview    — PNG thumbnail of page 1
 *
 * Edge cases:
 *   info with no file → 400
 *   info with wrong MIME → 400
 *   info with corrupt PDF → 400
 *   page-count with no file → 400
 *   page-count with wrong MIME → 400
 *   preview with no file → 400
 *   preview with wrong MIME → 400
 *   preview with out-of-range page → 400
 *   preview response is PNG image
 *   info response shape validation
 *   no auth required
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  postForm, get,
  makePDF, makePNG, makeCorruptPDF,
  C, sleep
} = require('./helpers');

const DELAY = 200;

// ─────────────────────────────────────────────────────────────────────────────
async function testHealth() {
  section('Metadata Service — Health');
  try {
    const res = await get('http://localhost:3009/health');
    res.status === 200 && res.json?.status === 'ok'
      ? pass('GET :3009/health → 200', `service="${res.json.service}"`)
      : fail('GET :3009/health', `status ${res.status}`);
  } catch (e) { fail('GET :3009/health', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testInfo() {
  section('Metadata — POST /api/meta/info');

  const pdf = makePDF();

  // Happy: extract info from valid PDF
  try {
    const res = await postForm('/api/meta/info', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (res.status === 200 && res.json?.success) {
      pass('POST /api/meta/info → 200');
      const d = res.json.data;

      // Validate response shape
      typeof d.pageCount === 'number' && d.pageCount > 0
        ? pass('  → pageCount is a positive number', String(d.pageCount))
        : fail('  → pageCount missing or invalid');

      typeof d.fileSizeBytes === 'number' && d.fileSizeBytes > 0
        ? pass('  → fileSizeBytes present', String(d.fileSizeBytes))
        : fail('  → fileSizeBytes missing');

      typeof d.fileSizeKB === 'number'
        ? pass('  → fileSizeKB present', String(d.fileSizeKB))
        : fail('  → fileSizeKB missing');

      Array.isArray(d.pages) && d.pages.length === d.pageCount
        ? pass('  → pages array matches pageCount')
        : fail('  → pages array missing or wrong length');

      if (d.pages?.length > 0) {
        const p = d.pages[0];
        typeof p.widthPt === 'number' && p.widthPt > 0
          ? pass('  → page[0].widthPt present', String(p.widthPt))
          : fail('  → page[0].widthPt missing');
        typeof p.heightPt === 'number' && p.heightPt > 0
          ? pass('  → page[0].heightPt present', String(p.heightPt))
          : fail('  → page[0].heightPt missing');
        typeof p.widthMm === 'number'
          ? pass('  → page[0].widthMm present', `${p.widthMm}mm`)
          : fail('  → page[0].widthMm missing');
        typeof p.rotation === 'number'
          ? pass('  → page[0].rotation present', `${p.rotation}°`)
          : fail('  → page[0].rotation missing');
      }

      // isEncrypted field
      typeof d.isEncrypted === 'boolean'
        ? pass('  → isEncrypted is boolean', String(d.isEncrypted))
        : fail('  → isEncrypted missing');

      // pdfVersion — read from file header (%PDF-x.y), not from producer
      (d.pdfVersion === null || typeof d.pdfVersion === 'string')
        ? pass('  → pdfVersion present', d.pdfVersion ? `"${d.pdfVersion}"` : 'null')
        : fail('  → pdfVersion wrong type', typeof d.pdfVersion);

      // fileSizeMB — should have 3 decimal places, not round to 0
      typeof d.fileSizeMB === 'number'
        ? pass('  → fileSizeMB present', `${d.fileSizeMB} MB`)
        : fail('  → fileSizeMB missing');
      // For a 539-byte file: 539 / (1024*1024) = 0.000514... → should show 0.001
      d.fileSizeMB > 0
        ? pass('  → fileSizeMB > 0 (3 decimal places working)', String(d.fileSizeMB))
        : fail('  → fileSizeMB rounds to 0 (precision too low)', String(d.fileSizeMB));

    } else {
      fail('POST /api/meta/info → 200', `status ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) { fail('POST /api/meta/info', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/meta/info', {}, []);
    res.status === 400
      ? pass('meta/info no file → 400')
      : fail('meta/info no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('meta/info no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/meta/info', {},
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('meta/info wrong MIME → 400')
      : fail('meta/info wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('meta/info wrong MIME → 400', e.message); }
  await sleep(DELAY);

  // Edge: corrupt PDF → 400 (loadPDF wraps pdf-lib errors → 400)
  try {
    const res = await postForm('/api/meta/info', {},
      [{ field: 'file', filename: 'corrupt.pdf', mime: 'application/pdf', data: makeCorruptPDF() }]
    );
    res.status === 400
      ? pass('meta/info corrupt PDF → 400')
      : fail('meta/info corrupt PDF', `expected 400, got ${res.status}: ${res.raw.slice(0, 80)}`);
  } catch (e) { fail('meta/info corrupt PDF → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testPageCount() {
  section('Metadata — POST /api/meta/page-count');

  const pdf = makePDF();

  // Happy: get page count
  try {
    const res = await postForm('/api/meta/page-count', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (res.status === 200 && res.json?.success) {
      pass('POST /api/meta/page-count → 200');
      const count = res.json.data?.pageCount;
      typeof count === 'number' && count > 0
        ? pass('  → pageCount is a positive number', String(count))
        : fail('  → pageCount missing or invalid', JSON.stringify(res.json.data));
    } else {
      fail('POST /api/meta/page-count → 200', `status ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) { fail('POST /api/meta/page-count', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/meta/page-count', {}, []);
    res.status === 400
      ? pass('page-count no file → 400')
      : fail('page-count no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('page-count no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/meta/page-count', {},
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('page-count wrong MIME → 400')
      : fail('page-count wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('page-count wrong MIME → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testPreview() {
  section('Metadata — POST /api/meta/preview');

  const pdf = makePDF();

  // Happy: generate preview of page 1
  try {
    const res = await postForm('/api/meta/preview',
      { page: '1', dpi: '72' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (res.status === 200) {
      pass('POST /api/meta/preview → 200', `${res.buffer.length} bytes`);

      // Response should be a PNG image
      const ct = res.headers['content-type'] || '';
      ct.includes('image/png')
        ? pass('  → Content-Type: image/png')
        : fail('  → Content-Type wrong', `got: ${ct}`);

      // PNG magic bytes: 0x89 0x50 0x4E 0x47
      const isPNG = res.buffer.length >= 4 &&
        res.buffer[0] === 0x89 &&
        res.buffer[1] === 0x50 &&
        res.buffer[2] === 0x4E &&
        res.buffer[3] === 0x47;
      isPNG
        ? pass('  → response starts with PNG magic bytes')
        : fail('  → response is not a PNG');

    } else {
      fail('POST /api/meta/preview → 200', `status ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) { fail('POST /api/meta/preview', e.message); }
  await sleep(DELAY);

  // Happy: default page (no page field)
  try {
    const res = await postForm('/api/meta/preview', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 200
      ? pass('Preview default page (no page field) → 200')
      : fail('Preview default page', `status ${res.status}`);
  } catch (e) { fail('Preview default page', e.message); }
  await sleep(DELAY);

  // Edge: out-of-range page → 400
  try {
    const res = await postForm('/api/meta/preview',
      { page: '999' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 400
      ? pass('Preview out-of-range page → 400')
      : fail('Preview out-of-range page', `expected 400, got ${res.status}`);
  } catch (e) { fail('Preview out-of-range page → 400', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/meta/preview', { page: '1' }, []);
    res.status === 400
      ? pass('Preview no file → 400')
      : fail('Preview no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Preview no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/meta/preview',
      { page: '1' },
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('Preview wrong MIME → 400')
      : fail('Preview wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Preview wrong MIME → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ METADATA SERVICE${C.reset}`);
  await testHealth();
  await testInfo();
  await testPageCount();
  await testPreview();
};
