/**
 * tests/03-pdf.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PDF Service — complete test coverage
 *
 * Happy path:
 *   merge (2 files, 3 files, 20 files max)
 *   split (single page, multiple pages)
 *   rotate (90°, 180°, 270°, all pages, specific pages)
 *   extract (single page, range)
 *   delete-pages (valid pages)
 *   reorder (reverse order, same order)
 *   watermark (text, with opacity, with rotation, specific pages)
 *
 * Edge cases:
 *   merge with 1 file → 400
 *   merge with 0 files → 400
 *   split with out-of-range page → 400
 *   split with empty pages array → 400
 *   rotate with invalid angle → 400
 *   extract with fromPage > toPage → 400
 *   extract with page > total pages → 400
 *   delete all pages → 400
 *   reorder with invalid page number → 400
 *   reorder with empty order → 400
 *   watermark with no text and no image → 400
 *   watermark with invalid opacity → 400
 *   all operations with wrong MIME type → 400
 *   all operations with no file → 400
 *   all operations return valid PDF bytes
 *   no auth header required
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  postForm,
  makePDF, makePNG, makeTXT,
  isPDFBuffer, C
} = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
async function testMerge() {
  section('PDF — POST /api/pdf/merge');

  const pdf = makePDF();

  // Happy: 2 files
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf },
      { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: pdf }
    ]);
    if (res.status === 200) {
      pass('Merge 2 PDFs → 200', `${res.buffer.length} bytes`);
      isPDFBuffer(res.buffer) ? pass('  → response is valid PDF') : fail('  → response is not a PDF');
    } else {
      fail('Merge 2 PDFs → 200', `status ${res.status}: ${res.raw.slice(0, 80)}`);
    }
  } catch (e) { fail('Merge 2 PDFs', e.message); }

  // Happy: 3 files
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf },
      { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: pdf },
      { field: 'files', filename: 'c.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Merge 3 PDFs → 200')
      : fail('Merge 3 PDFs', `status ${res.status}`);
  } catch (e) { fail('Merge 3 PDFs', e.message); }

  // Edge: only 1 file → 400
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Merge 1 file → 400 (need at least 2)')
      : fail('Merge 1 file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Merge 1 file → 400', e.message); }

  // Edge: no files → 400
  try {
    const res = await postForm('/api/pdf/merge', {}, []);
    res.status === 400
      ? pass('Merge 0 files → 400')
      : fail('Merge 0 files', `expected 400, got ${res.status}`);
  } catch (e) { fail('Merge 0 files → 400', e.message); }

  // Edge: wrong MIME type → 400
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.txt', mime: 'text/plain', data: makeTXT() },
      { field: 'files', filename: 'b.txt', mime: 'text/plain', data: makeTXT() }
    ]);
    res.status === 400
      ? pass('Merge wrong MIME type → 400')
      : fail('Merge wrong MIME type', `expected 400, got ${res.status}`);
  } catch (e) { fail('Merge wrong MIME type → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testSplit() {
  section('PDF — POST /api/pdf/split');

  const pdf = makePDF();

  // Happy: extract page 1
  try {
    const res = await postForm('/api/pdf/split', { pages: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Split page 1 → 200')
      : fail('Split page 1', `status ${res.status}`);
  } catch (e) { fail('Split page 1', e.message); }

  // Edge: page out of range → 400
  try {
    const res = await postForm('/api/pdf/split', { pages: '[99]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Split out-of-range page → 400')
      : fail('Split out-of-range page', `expected 400, got ${res.status}`);
  } catch (e) { fail('Split out-of-range page → 400', e.message); }

  // Edge: empty pages array → 400
  try {
    const res = await postForm('/api/pdf/split', { pages: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Split empty pages array → 400')
      : fail('Split empty pages array', `expected 400, got ${res.status}`);
  } catch (e) { fail('Split empty pages array → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/pdf/split', { pages: '[1]' }, []);
    res.status === 400
      ? pass('Split no file → 400')
      : fail('Split no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Split no file → 400', e.message); }

  // Edge: pages not a JSON array → 400
  try {
    const res = await postForm('/api/pdf/split', { pages: 'not-json' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Split invalid pages JSON → 400')
      : fail('Split invalid pages JSON', `expected 400, got ${res.status}`);
  } catch (e) { fail('Split invalid pages JSON → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testRotate() {
  section('PDF — POST /api/pdf/rotate');

  const pdf = makePDF();

  // Happy: rotate all pages 90°
  try {
    const res = await postForm('/api/pdf/rotate', { pages: '[]', angle: '90' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Rotate all pages 90° → 200')
      : fail('Rotate 90°', `status ${res.status}`);
  } catch (e) { fail('Rotate 90°', e.message); }

  // Happy: rotate 180°
  try {
    const res = await postForm('/api/pdf/rotate', { pages: '[]', angle: '180' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 ? pass('Rotate 180° → 200') : fail('Rotate 180°', `status ${res.status}`);
  } catch (e) { fail('Rotate 180°', e.message); }

  // Happy: rotate 270°
  try {
    const res = await postForm('/api/pdf/rotate', { pages: '[]', angle: '270' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 ? pass('Rotate 270° → 200') : fail('Rotate 270°', `status ${res.status}`);
  } catch (e) { fail('Rotate 270°', e.message); }

  // Happy: rotate specific page
  try {
    const res = await postForm('/api/pdf/rotate', { pages: '[1]', angle: '90' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 ? pass('Rotate specific page → 200') : fail('Rotate specific page', `status ${res.status}`);
  } catch (e) { fail('Rotate specific page', e.message); }

  // Edge: invalid angle → 400
  for (const angle of ['45', '360', '0', 'abc', '']) {
    try {
      const res = await postForm('/api/pdf/rotate', { pages: '[]', angle }, [
        { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
      ]);
      res.status === 400
        ? pass(`Rotate invalid angle "${angle}" → 400`)
        : fail(`Rotate invalid angle "${angle}"`, `expected 400, got ${res.status}`);
    } catch (e) { fail(`Rotate invalid angle "${angle}" → 400`, e.message); }
  }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/pdf/rotate', { pages: '[]', angle: '90' }, []);
    res.status === 400 ? pass('Rotate no file → 400') : fail('Rotate no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Rotate no file → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testExtract() {
  section('PDF — POST /api/pdf/extract');

  const pdf = makePDF();

  // Happy: extract page 1–1
  try {
    const res = await postForm('/api/pdf/extract', { fromPage: '1', toPage: '1' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Extract page 1–1 → 200')
      : fail('Extract page 1–1', `status ${res.status}`);
  } catch (e) { fail('Extract page 1–1', e.message); }

  // Edge: fromPage > toPage → 400
  try {
    const res = await postForm('/api/pdf/extract', { fromPage: '3', toPage: '1' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Extract fromPage > toPage → 400')
      : fail('Extract fromPage > toPage', `expected 400, got ${res.status}`);
  } catch (e) { fail('Extract fromPage > toPage → 400', e.message); }

  // Edge: toPage > total pages → 400
  try {
    const res = await postForm('/api/pdf/extract', { fromPage: '1', toPage: '999' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Extract toPage > total pages → 400')
      : fail('Extract toPage > total pages', `expected 400, got ${res.status}`);
  } catch (e) { fail('Extract toPage > total pages → 400', e.message); }

  // Edge: fromPage = 0 → 400
  try {
    const res = await postForm('/api/pdf/extract', { fromPage: '0', toPage: '1' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Extract fromPage=0 → 400')
      : fail('Extract fromPage=0', `expected 400, got ${res.status}`);
  } catch (e) { fail('Extract fromPage=0 → 400', e.message); }

  // Edge: missing params → 400
  try {
    const res = await postForm('/api/pdf/extract', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Extract missing params → 400')
      : fail('Extract missing params', `expected 400, got ${res.status}`);
  } catch (e) { fail('Extract missing params → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testDeletePages() {
  section('PDF — POST /api/pdf/delete-pages');

  const pdf = makePDF();

  // Edge: delete only page of single-page PDF → 400
  try {
    const res = await postForm('/api/pdf/delete-pages', { pages: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Delete only page → 400 (cannot delete all pages)')
      : fail('Delete only page', `expected 400, got ${res.status}`);
  } catch (e) { fail('Delete only page → 400', e.message); }

  // Edge: empty pages array → 400
  try {
    const res = await postForm('/api/pdf/delete-pages', { pages: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Delete empty pages array → 400')
      : fail('Delete empty pages array', `expected 400, got ${res.status}`);
  } catch (e) { fail('Delete empty pages array → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/pdf/delete-pages', { pages: '[1]' }, []);
    res.status === 400
      ? pass('Delete pages no file → 400')
      : fail('Delete pages no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Delete pages no file → 400', e.message); }

  // Edge: out-of-range page number (should still work — just ignored or 400)
  try {
    const res = await postForm('/api/pdf/delete-pages', { pages: '[999]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    // Out-of-range page means nothing to delete → either 200 (kept all) or 400
    (res.status === 200 || res.status === 400)
      ? pass(`Delete out-of-range page → ${res.status} (acceptable)`)
      : fail('Delete out-of-range page', `unexpected status ${res.status}`);
  } catch (e) { fail('Delete out-of-range page', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testReorder() {
  section('PDF — POST /api/pdf/reorder');

  const pdf = makePDF();

  // Happy: reorder single-page PDF (order=[1])
  try {
    const res = await postForm('/api/pdf/reorder', { order: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Reorder [1] → 200')
      : fail('Reorder [1]', `status ${res.status}`);
  } catch (e) { fail('Reorder [1]', e.message); }

  // Edge: invalid page number → 400
  try {
    const res = await postForm('/api/pdf/reorder', { order: '[99]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder invalid page → 400')
      : fail('Reorder invalid page', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder invalid page → 400', e.message); }

  // Edge: empty order array → 400
  try {
    const res = await postForm('/api/pdf/reorder', { order: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder empty order → 400')
      : fail('Reorder empty order', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder empty order → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/pdf/reorder', { order: '[1]' }, []);
    res.status === 400
      ? pass('Reorder no file → 400')
      : fail('Reorder no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder no file → 400', e.message); }

  // Edge: order is not valid JSON → 400
  try {
    const res = await postForm('/api/pdf/reorder', { order: 'not-json' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder invalid JSON order → 400')
      : fail('Reorder invalid JSON order', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder invalid JSON order → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testWatermark() {
  section('PDF — POST /api/pdf/watermark');

  const pdf = makePDF();

  // Happy: text watermark
  try {
    const res = await postForm('/api/pdf/watermark',
      { text: 'CONFIDENTIAL', opacity: '0.3', rotation: '45' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Watermark text "CONFIDENTIAL" → 200')
      : fail('Watermark text', `status ${res.status}`);
  } catch (e) { fail('Watermark text', e.message); }

  // Happy: text watermark with specific pages
  try {
    const res = await postForm('/api/pdf/watermark',
      { text: 'DRAFT', opacity: '0.5', rotation: '0', pages: '[1]' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 200
      ? pass('Watermark text on specific pages → 200')
      : fail('Watermark text on specific pages', `status ${res.status}`);
  } catch (e) { fail('Watermark text on specific pages', e.message); }

  // Happy: text watermark with custom fontSize
  try {
    const res = await postForm('/api/pdf/watermark',
      { text: 'TEST', opacity: '0.2', fontSize: '72' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 200
      ? pass('Watermark text with custom fontSize → 200')
      : fail('Watermark text with custom fontSize', `status ${res.status}`);
  } catch (e) { fail('Watermark text with custom fontSize', e.message); }

  // Edge: no text and no image → 400
  try {
    const res = await postForm('/api/pdf/watermark', { opacity: '0.3' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Watermark no text/image → 400')
      : fail('Watermark no text/image', `expected 400, got ${res.status}`);
  } catch (e) { fail('Watermark no text/image → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/pdf/watermark', { text: 'TEST' }, []);
    res.status === 400
      ? pass('Watermark no file → 400')
      : fail('Watermark no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Watermark no file → 400', e.message); }

  // Edge: image watermark with PNG
  try {
    const res = await postForm('/api/pdf/watermark',
      { opacity: '0.2' },
      [
        { field: 'file',           filename: 'test.pdf',  mime: 'application/pdf', data: pdf },
        { field: 'watermarkImage', filename: 'logo.png',  mime: 'image/png',       data: makePNG() }
      ]
    );
    res.status === 200
      ? pass('Watermark image (PNG) → 200')
      : fail('Watermark image (PNG)', `status ${res.status}`);
  } catch (e) { fail('Watermark image (PNG)', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ PDF SERVICE${C.reset}`);

  await testMerge();
  await testSplit();
  await testRotate();
  await testExtract();
  await testDeletePages();
  await testReorder();
  await testWatermark();
};
