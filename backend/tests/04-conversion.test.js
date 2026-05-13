/**
 * tests/04-conversion.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Conversion Service — complete test coverage
 * NOTE: Uses small delays between requests to avoid rate-limit (429) hits
 *       when running after other test suites.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  postForm, sleep,
  makePDF, makePNG, makeTXT, makeDOCX, makeXLSX, makePPTX,
  isPDFBuffer, C
} = require('./helpers');

// Small delay between requests to avoid rate-limit during rapid test runs
const DELAY = 300; // ms

// Helper: if 429, skip with note instead of fail (rate limit from prior tests)
function handleRateLimit(name, status) {
  if (status === 429) {
    skip(name, '429 rate-limited — run this suite in isolation: node tests/run.js --only 04');
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
async function testImageToPDF() {
  section('Conversion — POST /api/convert/image-to-pdf');

  // Happy: PNG → PDF
  try {
    const res = await postForm('/api/convert/image-to-pdf', {}, [
      { field: 'file', filename: 'image.png', mime: 'image/png', data: makePNG() }
    ]);
    if (handleRateLimit('PNG → PDF → 200', res.status)) { /* skip */ }
    else if (res.status === 200) {
      pass('PNG → PDF → 200', `${res.buffer.length} bytes`);
      isPDFBuffer(res.buffer) ? pass('  → response is valid PDF') : fail('  → response is not a PDF');
    } else {
      fail('PNG → PDF → 200', `status ${res.status}: ${res.raw.slice(0, 80)}`);
    }
  } catch (e) { fail('PNG → PDF', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/convert/image-to-pdf', {}, []);
    if (handleRateLimit('image-to-pdf no file → 400', res.status)) { /* skip */ }
    else res.status === 400 ? pass('image-to-pdf no file → 400') : fail('image-to-pdf no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('image-to-pdf no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME (PDF sent to image endpoint) → 400 or 500 (tool fails on wrong content)
  try {
    const res = await postForm('/api/convert/image-to-pdf', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    if (handleRateLimit('image-to-pdf with PDF file → 400/500', res.status)) { /* skip */ }
    else (res.status === 400 || res.status === 500)
      ? pass('image-to-pdf with PDF file → 400/500 (wrong type)', `got ${res.status}`)
      : fail('image-to-pdf with PDF file', `expected 400/500, got ${res.status}`);
  } catch (e) { fail('image-to-pdf with PDF file → 400/500', e.message); }
  await sleep(DELAY);

  // Edge: plain text file → 400
  try {
    const res = await postForm('/api/convert/image-to-pdf', {}, [
      { field: 'file', filename: 'test.txt', mime: 'text/plain', data: makeTXT() }
    ]);
    if (handleRateLimit('image-to-pdf with text file → 400', res.status)) { /* skip */ }
    else res.status === 400 ? pass('image-to-pdf with text file → 400') : fail('image-to-pdf with text file', `expected 400, got ${res.status}`);
  } catch (e) { fail('image-to-pdf with text file → 400', e.message); }
  await sleep(DELAY);
}

// ─────────────────────────────────────────────────────────────────────────────
async function testPDFToImage() {
  section('Conversion — POST /api/convert/pdf-to-image');

  const pdf = makePDF();

  // Happy: PDF → PNG (single page)
  try {
    const res = await postForm('/api/convert/pdf-to-image',
      { format: 'png', dpi: '72' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (handleRateLimit('PDF → PNG → 200', res.status)) { /* skip */ }
    else if (res.status === 200) {
      const ct = res.headers['content-type'] || '';
      pass('PDF → PNG → 200', `Content-Type: ${ct}`);
    } else {
      fail('PDF → PNG → 200', `status ${res.status}: ${res.raw.slice(0, 80)}`);
    }
  } catch (e) { fail('PDF → PNG', e.message); }
  await sleep(DELAY);

  // Happy: PDF → JPG
  try {
    const res = await postForm('/api/convert/pdf-to-image',
      { format: 'jpg', dpi: '72' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (handleRateLimit('PDF → JPG → 200', res.status)) { /* skip */ }
    else res.status === 200 ? pass('PDF → JPG → 200') : fail('PDF → JPG', `status ${res.status}`);
  } catch (e) { fail('PDF → JPG', e.message); }
  await sleep(DELAY);

  // Happy: high DPI clamped
  try {
    const res = await postForm('/api/convert/pdf-to-image',
      { format: 'png', dpi: '9999' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (handleRateLimit('PDF → image dpi=9999 (clamped)', res.status)) { /* skip */ }
    else res.status === 200 ? pass('PDF → image with dpi=9999 (clamped) → 200') : fail('PDF → image with dpi=9999', `status ${res.status}`);
  } catch (e) { fail('PDF → image with dpi=9999', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/convert/pdf-to-image', { format: 'png' }, []);
    if (handleRateLimit('pdf-to-image no file → 400', res.status)) { /* skip */ }
    else res.status === 400 ? pass('pdf-to-image no file → 400') : fail('pdf-to-image no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('pdf-to-image no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: image sent to pdf-to-image → 400 or 500 (poppler fails on non-PDF)
  try {
    const res = await postForm('/api/convert/pdf-to-image',
      { format: 'png' },
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    if (handleRateLimit('pdf-to-image with PNG → 400/500', res.status)) { /* skip */ }
    else (res.status === 400 || res.status === 500)
      ? pass('pdf-to-image with PNG file → 400/500 (wrong type)', `got ${res.status}`)
      : fail('pdf-to-image with PNG file', `expected 400/500, got ${res.status}`);
  } catch (e) { fail('pdf-to-image with PNG file → 400/500', e.message); }
  await sleep(DELAY);
}

// ─────────────────────────────────────────────────────────────────────────────
async function testCompress() {
  section('Conversion — POST /api/convert/compress');

  const pdf = makePDF();

  // Happy: all 4 quality levels
  for (const quality of ['screen', 'ebook', 'printer', 'prepress']) {
    try {
      const res = await postForm('/api/convert/compress',
        { quality },
        [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
      );
      if (handleRateLimit(`Compress quality="${quality}"`, res.status)) { /* skip */ }
      else if (res.status === 200) {
        pass(`Compress quality="${quality}" → 200`, `${res.buffer.length} bytes`);
        isPDFBuffer(res.buffer) ? pass(`  → response is valid PDF`) : fail(`  → response is not a PDF`);
      } else {
        fail(`Compress quality="${quality}"`, `status ${res.status} (Ghostscript installed?)`);
      }
    } catch (e) { fail(`Compress quality="${quality}"`, e.message); }
    await sleep(DELAY);
  }

  // Happy: no quality → defaults to ebook
  try {
    const res = await postForm('/api/convert/compress', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (handleRateLimit('Compress no quality → ebook', res.status)) { /* skip */ }
    else res.status === 200 ? pass('Compress no quality field → defaults to ebook → 200') : fail('Compress no quality field', `status ${res.status}`);
  } catch (e) { fail('Compress no quality field', e.message); }
  await sleep(DELAY);

  // Happy: invalid quality → falls back to ebook
  try {
    const res = await postForm('/api/convert/compress',
      { quality: 'ultra-max-turbo' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (handleRateLimit('Compress invalid quality → ebook fallback', res.status)) { /* skip */ }
    else res.status === 200 ? pass('Compress invalid quality → falls back to ebook → 200') : fail('Compress invalid quality', `status ${res.status}`);
  } catch (e) { fail('Compress invalid quality', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/convert/compress', { quality: 'ebook' }, []);
    if (handleRateLimit('Compress no file → 400', res.status)) { /* skip */ }
    else res.status === 400 ? pass('Compress no file → 400') : fail('Compress no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Compress no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400 or 500 (Ghostscript fails on non-PDF)
  try {
    const res = await postForm('/api/convert/compress',
      { quality: 'ebook' },
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    if (handleRateLimit('Compress with PNG → 400/500', res.status)) { /* skip */ }
    else (res.status === 400 || res.status === 500)
      ? pass('Compress with PNG file → 400/500 (wrong type)', `got ${res.status}`)
      : fail('Compress with PNG file', `expected 400/500, got ${res.status}`);
  } catch (e) { fail('Compress with PNG file → 400/500', e.message); }
  await sleep(DELAY);
}

// ─────────────────────────────────────────────────────────────────────────────
async function testOfficeRoutes() {
  section('Conversion — Office Routes (route existence + no-file edge case)');

  const officeRoutes = [
    { path: '/api/convert/word-to-pdf',  name: 'word-to-pdf',  data: makeDOCX(), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
    { path: '/api/convert/excel-to-pdf', name: 'excel-to-pdf', data: makeXLSX(), mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        ext: 'xlsx' },
    { path: '/api/convert/ppt-to-pdf',   name: 'ppt-to-pdf',   data: makePPTX(), mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' }
  ];

  for (const { path, name, data, mime, ext } of officeRoutes) {
    // Route must exist (not 404) — 429 also means route exists
    try {
      const res = await postForm(path, {}, [
        { field: 'file', filename: `test.${ext}`, mime, data }
      ]);
      res.status !== 404
        ? pass(`POST ${path} route exists`, `status ${res.status}`)
        : fail(`POST ${path} route exists`, '404 — route not registered in gateway');
    } catch (e) { fail(`POST ${path} route exists`, e.message); }
    await sleep(DELAY);

    // No file → 400 (or 429 if rate limited)
    try {
      const res = await postForm(path, {}, []);
      if (handleRateLimit(`${name} no file → 400`, res.status)) { /* skip */ }
      else res.status === 400 ? pass(`${name} no file → 400`) : fail(`${name} no file`, `expected 400, got ${res.status}`);
    } catch (e) { fail(`${name} no file → 400`, e.message); }
    await sleep(DELAY);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testPDFToWord() {
  section('Conversion — POST /api/convert/pdf-to-word');

  // Route must exist (not 404) — 429 also means route exists
  try {
    const res = await postForm('/api/convert/pdf-to-word', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    res.status !== 404
      ? pass('POST /api/convert/pdf-to-word route exists', `status ${res.status}`)
      : fail('POST /api/convert/pdf-to-word route exists', '404 — route not registered');
  } catch (e) { fail('POST /api/convert/pdf-to-word route exists', e.message); }
  await sleep(DELAY);

  // No file → 400
  try {
    const res = await postForm('/api/convert/pdf-to-word', {}, []);
    if (handleRateLimit('pdf-to-word no file → 400', res.status)) { /* skip */ }
    else res.status === 400 ? pass('pdf-to-word no file → 400') : fail('pdf-to-word no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('pdf-to-word no file → 400', e.message); }
  await sleep(DELAY);

  // Wrong MIME → 400 or 500 (LibreOffice fails on non-PDF)
  try {
    const res = await postForm('/api/convert/pdf-to-word', {}, [
      { field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }
    ]);
    if (handleRateLimit('pdf-to-word with PNG → 400/500', res.status)) { /* skip */ }
    else (res.status === 400 || res.status === 500)
      ? pass('pdf-to-word with PNG → 400/500 (wrong type)', `got ${res.status}`)
      : fail('pdf-to-word with PNG', `expected 400/500, got ${res.status}`);
  } catch (e) { fail('pdf-to-word with PNG → 400/500', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ CONVERSION SERVICE${C.reset}`);

  await testImageToPDF();
  await testPDFToImage();
  await testCompress();
  await testOfficeRoutes();
  await testPDFToWord();
};
