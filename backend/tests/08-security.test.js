/**
 * tests/08-security.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security Service — complete test coverage
 *
 * Happy path:
 *   protect  — add password to PDF
 *   unlock   — remove password from PDF (requires correct password)
 *   remove-metadata — strip all metadata from PDF
 *
 * Edge cases:
 *   protect with no file → 400
 *   protect with no userPassword → 400
 *   protect with wrong MIME → 400
 *   unlock with no file → 400
 *   unlock with no password → 400
 *   unlock with wrong password → 400
 *   unlock with wrong MIME → 400
 *   remove-metadata with no file → 400
 *   remove-metadata with wrong MIME → 400
 *   remove-metadata with corrupt PDF → 400
 *   all operations return valid PDF bytes
 *   no auth required
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  postForm, get,
  makePDF, makeProperPDF, makePNG, makeCorruptPDF,
  isPDFBuffer, C, sleep
} = require('./helpers');

const DELAY = 200;

// ─────────────────────────────────────────────────────────────────────────────
async function testHealth() {
  section('Security Service — Health');
  try {
    const res = await get('http://localhost:3008/health');
    res.status === 200 && res.json?.status === 'ok'
      ? pass('GET :3008/health → 200', `service="${res.json.service}"`)
      : fail('GET :3008/health', `status ${res.status}`);
  } catch (e) { fail('GET :3008/health', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testProtect() {
  section('Security — POST /api/security/protect');

  // Use a proper pdf-lib generated PDF — qpdf requires valid PDF structure
  const pdf = makeProperPDF();

  // Happy: protect with userPassword
  try {
    const res = await postForm('/api/security/protect',
      { userPassword: 'secret123' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (res.status === 200) {
      pass('Protect PDF with password → 200', `${res.buffer.length} bytes`);
      isPDFBuffer(res.buffer) ? pass('  → response is valid PDF') : fail('  → not a PDF');
    } else {
      fail('Protect PDF with password', `status ${res.status}: ${res.raw.slice(0, 120)}`);
    }
  } catch (e) { fail('Protect PDF', e.message); }
  await sleep(DELAY);

  // Happy: protect with both userPassword and ownerPassword
  try {
    const res = await postForm('/api/security/protect',
      { userPassword: 'open123', ownerPassword: 'owner456' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 200
      ? pass('Protect with owner password → 200')
      : fail('Protect with owner password', `status ${res.status}`);
  } catch (e) { fail('Protect with owner password', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/security/protect', { userPassword: 'test' }, []);
    res.status === 400
      ? pass('Protect no file → 400')
      : fail('Protect no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Protect no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: no userPassword → 400
  try {
    const res = await postForm('/api/security/protect', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 400
      ? pass('Protect no userPassword → 400')
      : fail('Protect no userPassword', `expected 400, got ${res.status}`);
  } catch (e) { fail('Protect no userPassword → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/security/protect',
      { userPassword: 'test' },
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('Protect wrong MIME → 400')
      : fail('Protect wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Protect wrong MIME → 400', e.message); }
  await sleep(DELAY);

  // Edge: corrupt PDF → 400 (classifyQpdfError maps qpdf failures to 400)
  try {
    const res = await postForm('/api/security/protect',
      { userPassword: 'test' },
      [{ field: 'file', filename: 'corrupt.pdf', mime: 'application/pdf', data: makeCorruptPDF() }]
    );
    res.status === 400
      ? pass('Protect corrupt PDF → 400')
      : fail('Protect corrupt PDF', `expected 400, got ${res.status}: ${res.raw.slice(0, 80)}`);
  } catch (e) { fail('Protect corrupt PDF → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testUnlock() {
  section('Security — POST /api/security/unlock');

  const pdf = makeProperPDF();

  // First protect a PDF, then unlock it — full round-trip
  let protectedBuffer = null;
  try {
    const protectRes = await postForm('/api/security/protect',
      { userPassword: 'roundtrip123' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (protectRes.status === 200) {
      protectedBuffer = protectRes.buffer;
      pass('Round-trip: protect step → 200', `${protectedBuffer.length} bytes`);
    } else {
      fail('Round-trip: protect step', `status ${protectRes.status}`);
    }
  } catch (e) { fail('Round-trip: protect step', e.message); }
  await sleep(DELAY);

  // Unlock the protected PDF with correct password
  if (protectedBuffer) {
    try {
      const res = await postForm('/api/security/unlock',
        { password: 'roundtrip123' },
        [{ field: 'file', filename: 'protected.pdf', mime: 'application/pdf', data: protectedBuffer }]
      );
      if (res.status === 200) {
        pass('Round-trip: unlock with correct password → 200', `${res.buffer.length} bytes`);
        isPDFBuffer(res.buffer) ? pass('  → response is valid PDF') : fail('  → not a PDF');
      } else {
        fail('Round-trip: unlock with correct password', `status ${res.status}: ${res.raw.slice(0, 120)}`);
      }
    } catch (e) { fail('Round-trip: unlock', e.message); }
    await sleep(DELAY);

    // Unlock with wrong password → 400
    try {
      const res = await postForm('/api/security/unlock',
        { password: 'wrongpassword' },
        [{ field: 'file', filename: 'protected.pdf', mime: 'application/pdf', data: protectedBuffer }]
      );
      res.status === 400
        ? pass('Unlock with wrong password → 400')
        : fail('Unlock with wrong password', `expected 400, got ${res.status}`);
    } catch (e) { fail('Unlock with wrong password → 400', e.message); }
    await sleep(DELAY);
  }

  // Edge: no file → 400
  try {
    const res = await postForm('/api/security/unlock', { password: 'test' }, []);
    res.status === 400
      ? pass('Unlock no file → 400')
      : fail('Unlock no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Unlock no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: no password → 400
  try {
    const res = await postForm('/api/security/unlock', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    res.status === 400
      ? pass('Unlock no password → 400')
      : fail('Unlock no password', `expected 400, got ${res.status}`);
  } catch (e) { fail('Unlock no password → 400', e.message); }
  await sleep(DELAY);

  // Edge: unlock a non-encrypted PDF — qpdf copies it as-is (200 is correct)
  // qpdf treats "decrypt" on a non-encrypted file as a no-op copy, not an error
  try {
    const res = await postForm('/api/security/unlock',
      { password: 'anypassword' },
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    (res.status === 200 || res.status === 400)
      ? pass('Unlock non-encrypted PDF → 200/400 (qpdf behavior)', `got ${res.status}`)
      : fail('Unlock non-encrypted PDF', `unexpected status ${res.status}`);
  } catch (e) { fail('Unlock non-encrypted PDF', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/security/unlock',
      { password: 'test' },
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('Unlock wrong MIME → 400')
      : fail('Unlock wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Unlock wrong MIME → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testRemoveMetadata() {
  section('Security — POST /api/security/remove-metadata');

  const pdf = makeProperPDF();

  // Happy: remove metadata from a valid PDF
  try {
    const res = await postForm('/api/security/remove-metadata', {},
      [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
    );
    if (res.status === 200) {
      pass('Remove metadata → 200', `${res.buffer.length} bytes`);
      isPDFBuffer(res.buffer) ? pass('  → response is valid PDF') : fail('  → not a PDF');
    } else {
      fail('Remove metadata', `status ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) { fail('Remove metadata', e.message); }
  await sleep(DELAY);

  // Edge: no file → 400
  try {
    const res = await postForm('/api/security/remove-metadata', {}, []);
    res.status === 400
      ? pass('Remove metadata no file → 400')
      : fail('Remove metadata no file', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove metadata no file → 400', e.message); }
  await sleep(DELAY);

  // Edge: wrong MIME → 400
  try {
    const res = await postForm('/api/security/remove-metadata', {},
      [{ field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }]
    );
    res.status === 400
      ? pass('Remove metadata wrong MIME → 400')
      : fail('Remove metadata wrong MIME', `expected 400, got ${res.status}`);
  } catch (e) { fail('Remove metadata wrong MIME → 400', e.message); }
  await sleep(DELAY);

  // Edge: corrupt PDF → 400 (loadPDF + pdf.save() both wrapped → 400)
  try {
    const res = await postForm('/api/security/remove-metadata', {},
      [{ field: 'file', filename: 'corrupt.pdf', mime: 'application/pdf', data: makeCorruptPDF() }]
    );
    res.status === 400
      ? pass('Remove metadata corrupt PDF → 400')
      : fail('Remove metadata corrupt PDF', `expected 400, got ${res.status}: ${res.raw.slice(0, 80)}`);
  } catch (e) { fail('Remove metadata corrupt PDF → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ SECURITY SERVICE${C.reset}`);
  await testHealth();
  await testProtect();
  await testUnlock();
  await testRemoveMetadata();
};
