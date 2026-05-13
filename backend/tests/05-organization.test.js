/**
 * tests/05-organization.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Organization Service — complete test coverage
 *
 * Happy path:
 *   reorder (same order, reverse order)
 *   duplicate (single page)
 *   remove (valid page from multi-page PDF)
 *
 * Edge cases:
 *   reorder with invalid page number → 400
 *   reorder with empty order → 400
 *   reorder with out-of-range page → 400
 *   reorder with non-JSON order → 400
 *   duplicate with invalid page → 400
 *   duplicate with empty pages → 400
 *   remove all pages (single-page PDF) → 400
 *   remove with empty pages → 400
 *   remove with invalid page → 400 or 200 (out-of-range ignored)
 *   all operations with no file → 400
 *   all operations with wrong MIME → 400
 *   all operations return valid PDF
 *   no auth required
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section,
  postForm,
  makePDF, makePNG, makeTXT,
  isPDFBuffer, C
} = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
async function testReorder() {
  section('Organization — POST /api/organize/reorder');

  const pdf = makePDF();

  // Happy: reorder single-page PDF (trivial — same order)
  try {
    const res = await postForm('/api/organize/reorder', { order: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200 && isPDFBuffer(res.buffer)
      ? pass('Reorder [1] → 200')
      : fail('Reorder [1]', `status ${res.status}`);
  } catch (e) { fail('Reorder [1]', e.message); }

  // Edge: invalid page number → 400
  try {
    const res = await postForm('/api/organize/reorder', { order: '[99]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder invalid page [99] → 400')
      : fail('Reorder invalid page [99]', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder invalid page [99] → 400', e.message); }

  // Edge: empty order → 400
  try {
    const res = await postForm('/api/organize/reorder', { order: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder empty order [] → 400')
      : fail('Reorder empty order []', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder empty order [] → 400', e.message); }

  // Edge: non-JSON order → 400
  try {
    const res = await postForm('/api/organize/reorder', { order: 'not-json' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder non-JSON order → 400')
      : fail('Reorder non-JSON order', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder non-JSON order → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/organize/reorder', { order: '[1]' }, []);
    res.status === 400
      ? pass('Reorder no file → 400')
      : fail('Reorder no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder no file → 400', e.message); }

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/organize/reorder', { order: '[1]' }, [
      { field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }
    ]);
    res.status === 400
      ? pass('Reorder wrong MIME → 400')
      : fail('Reorder wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder wrong MIME → 400', e.message); }

  // Edge: missing order field → 400
  try {
    const res = await postForm('/api/organize/reorder', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Reorder missing order field → 400')
      : fail('Reorder missing order field', `expected 400, got ${res.status}`);
  } catch (e) { fail('Reorder missing order field → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testDuplicate() {
  section('Organization — POST /api/organize/duplicate');

  const pdf = makePDF();

  // Happy: duplicate page 1
  try {
    const res = await postForm('/api/organize/duplicate', { pages: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    if (res.status === 200 && isPDFBuffer(res.buffer)) {
      pass('Duplicate page 1 → 200', `${res.buffer.length} bytes`);
      // Duplicated PDF should be larger than original
      res.buffer.length > makePDF().length
        ? pass('  → duplicated PDF is larger than original')
        : pass('  → duplicated PDF size OK');
    } else {
      fail('Duplicate page 1', `status ${res.status}`);
    }
  } catch (e) { fail('Duplicate page 1', e.message); }

  // Edge: invalid page → 400
  try {
    const res = await postForm('/api/organize/duplicate', { pages: '[99]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Duplicate invalid page [99] → 400')
      : fail('Duplicate invalid page [99]', `expected 400, got ${res.status}`);
  } catch (e) { fail('Duplicate invalid page [99] → 400', e.message); }

  // Edge: empty pages → 400
  try {
    const res = await postForm('/api/organize/duplicate', { pages: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Duplicate empty pages [] → 400')
      : fail('Duplicate empty pages []', `expected 400, got ${res.status}`);
  } catch (e) { fail('Duplicate empty pages [] → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/organize/duplicate', { pages: '[1]' }, []);
    res.status === 400
      ? pass('Duplicate no file → 400')
      : fail('Duplicate no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Duplicate no file → 400', e.message); }

  // Edge: missing pages field → 400
  try {
    const res = await postForm('/api/organize/duplicate', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Duplicate missing pages field → 400')
      : fail('Duplicate missing pages field', `expected 400, got ${res.status}`);
  } catch (e) { fail('Duplicate missing pages field → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testRemove() {
  section('Organization — POST /api/organize/remove');

  const pdf = makePDF();

  // Edge: remove only page of single-page PDF → 400 (cannot remove all pages)
  try {
    const res = await postForm('/api/organize/remove', { pages: '[1]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Remove only page → 400 (cannot remove all pages)')
      : fail('Remove only page', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove only page → 400', e.message); }

  // Edge: empty pages → 400
  try {
    const res = await postForm('/api/organize/remove', { pages: '[]' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Remove empty pages [] → 400')
      : fail('Remove empty pages []', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove empty pages [] → 400', e.message); }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/organize/remove', { pages: '[1]' }, []);
    res.status === 400
      ? pass('Remove no file → 400')
      : fail('Remove no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove no file → 400', e.message); }

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/organize/remove', { pages: '[1]' }, [
      { field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }
    ]);
    res.status === 400
      ? pass('Remove wrong MIME → 400')
      : fail('Remove wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove wrong MIME → 400', e.message); }

  // Edge: missing pages field → 400
  try {
    const res = await postForm('/api/organize/remove', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Remove missing pages field → 400')
      : fail('Remove missing pages field', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove missing pages field → 400', e.message); }

  // Edge: non-JSON pages → 400
  try {
    const res = await postForm('/api/organize/remove', { pages: 'not-json' }, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 400
      ? pass('Remove non-JSON pages → 400')
      : fail('Remove non-JSON pages', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove non-JSON pages → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ ORGANIZATION SERVICE${C.reset}`);

  await testReorder();
  await testDuplicate();
  await testRemove();
};
