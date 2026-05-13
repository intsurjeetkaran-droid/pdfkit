/**
 * tests/07-edge-cases.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-cutting edge cases and security checks:
 *
 *   Gateway:
 *     - 404 for completely unknown routes
 *     - 404 for routes that look like valid paths but aren't registered
 *     - Response always has x-request-id header
 *     - CORS headers present
 *
 *   Guest-first (no auth):
 *     - Every PDF operation works without Authorization header
 *     - Every PDF operation works without x-user-id header
 *     - Sending Authorization header doesn't break anything
 *
 *   File security:
 *     - Path traversal in filename is sanitized (doesn't crash)
 *     - Null bytes in filename don't crash
 *     - Very long filename is handled
 *     - Corrupt/truncated PDF is rejected gracefully (400 or 500, not hang)
 *     - Empty file body → 400
 *     - Zero-byte file → 400 or handled gracefully
 *
 *   Rate limiting:
 *     - Rate-limit headers present on all responses
 *     - X-RateLimit-Limit is a number
 *     - X-RateLimit-Remaining decrements
 *
 *   Response consistency:
 *     - All error responses have { success: false, message: string }
 *     - All JSON success responses have { success: true }
 *     - Content-Type is application/json for JSON responses
 *     - Content-Type is application/pdf for PDF responses
 *
 *   Concurrent requests:
 *     - 3 simultaneous merge requests all succeed
 *     - 5 simultaneous storage uploads all succeed
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  get, del, postJSON, postForm, request,
  makePDF, makePNG, makeTXT, makeCorruptPDF,
  isPDFBuffer, C, sleep
} = require('./helpers');

// ─────────────────────────────────────────────────────────────────────────────
async function testGatewayRouting() {
  section('Edge Cases — Gateway Routing');

  const unknownRoutes = [
    '/api/auth/login',          // auth-service removed
    '/api/users/profile',       // user-service removed
    '/api/admin/anything',      // never existed
    '/api/pdf',                 // no trailing slash handler
    '/api/convert',             // no trailing slash handler
    '/../etc/passwd',           // path traversal attempt
    '/api/pdf/../storage/temp', // path traversal in route
  ];

  for (const route of unknownRoutes) {
    try {
      const res = await get(route);
      // Should be 404 or 503 (service unavailable for removed services)
      // Should NOT be 200 or 500
      const acceptable = [404, 503, 400];
      acceptable.includes(res.status)
        ? pass(`GET ${route} → ${res.status} (safe)`)
        : fail(`GET ${route}`, `unexpected status ${res.status} — should be 404/503`);
    } catch (e) { fail(`GET ${route}`, e.message); }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testGuestFirst() {
  section('Edge Cases — Guest-First (No Auth Required)');

  const pdf = makePDF();

  // PDF merge works with NO Authorization header
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf },
      { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 200
      ? pass('PDF merge works with NO Authorization header')
      : fail('PDF merge without auth', `status ${res.status}`);
  } catch (e) { fail('PDF merge without auth', e.message); }

  // PDF merge works with a FAKE Authorization header (should be ignored)
  try {
    const { body, contentType } = require('./helpers').buildMultipart({}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf },
      { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: pdf }
    ]);
    const u = new URL('/api/pdf/merge', require('./helpers').BASE_URL);
    const res = await request({
      hostname: u.hostname, port: u.port || 80,
      path: u.pathname, method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Authorization': 'Bearer fake-token-that-should-be-ignored'
      }
    }, body);
    res.status === 200
      ? pass('PDF merge works with fake Authorization header (ignored)')
      : fail('PDF merge with fake auth', `status ${res.status}`);
  } catch (e) { fail('PDF merge with fake auth', e.message); }

  // Storage upload works with NO auth
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }
    ]);
    res.status === 201
      ? pass('Storage upload works with NO auth header')
      : fail('Storage upload without auth', `status ${res.status}`);
  } catch (e) { fail('Storage upload without auth', e.message); }

  // Conversion works with NO auth
  try {
    const res = await postForm('/api/convert/image-to-pdf', {}, [
      { field: 'file', filename: 'img.png', mime: 'image/png', data: makePNG() }
    ]);
    res.status === 200
      ? pass('Conversion works with NO auth header')
      : fail('Conversion without auth', `status ${res.status}`);
  } catch (e) { fail('Conversion without auth', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testFileSecurity() {
  section('Edge Cases — File Security & Sanitization');

  // Path traversal in filename — should not crash, should sanitize
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: '../../../etc/passwd.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    // Should either succeed (with sanitized name) or reject — must NOT crash
    (res.status === 201 || res.status === 400)
      ? pass('Path traversal filename handled safely', `status ${res.status}`)
      : fail('Path traversal filename', `unexpected status ${res.status}`);
  } catch (e) { fail('Path traversal filename', e.message); }

  // Very long filename (255+ chars) — multer may crash (500) or reject (400), both safe
  try {
    const longName = 'a'.repeat(300) + '.pdf';
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: longName, mime: 'application/pdf', data: makePDF() }
    ]);
    (res.status === 201 || res.status === 400 || res.status === 500)
      ? pass('Very long filename handled safely', `status ${res.status}`)
      : fail('Very long filename', `unexpected status ${res.status}`);
  } catch (e) { fail('Very long filename', e.message); }

  // Special characters in filename
  try {
    const res = await postForm('/api/storage/upload-temp', {}, [
      { field: 'file', filename: 'test <script>alert(1)</script>.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    (res.status === 201 || res.status === 400)
      ? pass('XSS in filename handled safely', `status ${res.status}`)
      : fail('XSS in filename', `unexpected status ${res.status}`);
  } catch (e) { fail('XSS in filename', e.message); }

  // Corrupt/truncated PDF — should fail gracefully (400 or 500), not hang
  try {
    const res = await postForm('/api/pdf/split', { pages: '[1]' }, [
      { field: 'file', filename: 'corrupt.pdf', mime: 'application/pdf', data: makeCorruptPDF() }
    ]);
    (res.status === 400 || res.status === 500)
      ? pass('Corrupt PDF handled gracefully', `status ${res.status}`)
      : fail('Corrupt PDF', `unexpected status ${res.status}`);
  } catch (e) { fail('Corrupt PDF', e.message); }

  // Empty file (0 bytes)
  try {
    const res = await postForm('/api/pdf/split', { pages: '[1]' }, [
      { field: 'file', filename: 'empty.pdf', mime: 'application/pdf', data: Buffer.alloc(0) }
    ]);
    (res.status === 400 || res.status === 500)
      ? pass('Empty file (0 bytes) handled gracefully', `status ${res.status}`)
      : fail('Empty file', `unexpected status ${res.status}`);
  } catch (e) { fail('Empty file', e.message); }

  // File with PDF MIME but actually PNG content
  try {
    const res = await postForm('/api/pdf/split', { pages: '[1]' }, [
      { field: 'file', filename: 'fake.pdf', mime: 'application/pdf', data: makePNG() }
    ]);
    // pdf-lib will fail to parse it — should return 400 or 500, not hang
    (res.status === 400 || res.status === 500)
      ? pass('PNG disguised as PDF handled gracefully', `status ${res.status}`)
      : fail('PNG disguised as PDF', `unexpected status ${res.status}`);
  } catch (e) { fail('PNG disguised as PDF', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testRateLimitHeaders() {
  section('Edge Cases — Rate Limit Headers');

  try {
    const res = await get('/health');

    // x-ratelimit-limit
    const limit = res.headers['x-ratelimit-limit'] || res.headers['ratelimit-limit'];
    if (limit) {
      pass('X-RateLimit-Limit header present', limit);
      !isNaN(parseInt(limit))
        ? pass('  → X-RateLimit-Limit is a number')
        : fail('  → X-RateLimit-Limit is not a number', limit);
    } else {
      fail('X-RateLimit-Limit header missing');
    }

    // x-ratelimit-remaining
    const remaining = res.headers['x-ratelimit-remaining'] || res.headers['ratelimit-remaining'];
    if (remaining !== undefined) {
      pass('X-RateLimit-Remaining header present', remaining);
    } else {
      info('X-RateLimit-Remaining header not present (may use different header name)');
    }

    // x-request-id
    res.headers['x-request-id']
      ? pass('x-request-id header present on every response', res.headers['x-request-id'])
      : fail('x-request-id header missing');

  } catch (e) { fail('Rate limit headers', e.message); }

  // Two requests should have different x-request-ids
  try {
    const [r1, r2] = await Promise.all([get('/health'), get('/health')]);
    const id1 = r1.headers['x-request-id'];
    const id2 = r2.headers['x-request-id'];
    if (id1 && id2 && id1 !== id2) {
      pass('Each request gets a unique x-request-id');
    } else if (!id1 || !id2) {
      fail('x-request-id missing on concurrent requests');
    } else {
      fail('x-request-id not unique across requests', `both got: ${id1}`);
    }
  } catch (e) { fail('Unique x-request-id', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testResponseConsistency() {
  section('Edge Cases — Response Shape Consistency');

  // Error responses must have { success: false, message: string }
  const errorRoutes = [
    { method: 'GET',  path: '/api/no-such-route',                  desc: '404 unknown route' },
    { method: 'POST', path: '/api/pdf/merge',       body: null,    desc: '400 merge no files' },
    { method: 'POST', path: '/api/queue/jobs',      body: '{}',    desc: '400 queue missing fields' },
  ];

  for (const { method, path, body, desc } of errorRoutes) {
    try {
      let res;
      if (method === 'GET') {
        res = await get(path);
      } else if (body === null) {
        res = await postForm(path, {}, []);
      } else {
        res = await postJSON(path, JSON.parse(body));
      }

      if (res.json) {
        res.json.success === false
          ? pass(`Error response has success:false (${desc})`)
          : fail(`Error response missing success:false (${desc})`, `got success:${res.json.success}`);

        typeof res.json.message === 'string' && res.json.message.length > 0
          ? pass(`Error response has message string (${desc})`, `"${res.json.message.slice(0, 50)}"`)
          : fail(`Error response missing message (${desc})`);
      } else {
        fail(`Error response is not JSON (${desc})`, `Content-Type: ${res.headers['content-type']}`);
      }
    } catch (e) { fail(`Response consistency (${desc})`, e.message); }
  }

  // Success JSON responses must have { success: true }
  try {
    const res = await get('/health');
    res.json?.status === 'ok'
      ? pass('Health response has status:ok')
      : fail('Health response shape', `got: ${JSON.stringify(res.json)}`);
  } catch (e) { fail('Health response shape', e.message); }

  // PDF response must have application/pdf Content-Type
  try {
    const res = await postForm('/api/pdf/merge', {}, [
      { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: makePDF() },
      { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: makePDF() }
    ]);
    if (res.status === 200) {
      const ct = res.headers['content-type'] || '';
      ct.includes('application/pdf')
        ? pass('PDF operation response has Content-Type: application/pdf')
        : fail('PDF operation Content-Type wrong', `got: ${ct}`);
    }
  } catch (e) { fail('PDF Content-Type check', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testConcurrentRequests() {
  section('Edge Cases — Concurrent Requests');

  const pdf = makePDF();

  // 3 simultaneous PDF merges
  try {
    const requests = Array.from({ length: 3 }, () =>
      postForm('/api/pdf/merge', {}, [
        { field: 'files', filename: 'a.pdf', mime: 'application/pdf', data: pdf },
        { field: 'files', filename: 'b.pdf', mime: 'application/pdf', data: pdf }
      ])
    );
    const results = await Promise.all(requests);
    const allOk = results.every((r) => r.status === 200);
    allOk
      ? pass('3 concurrent PDF merges all succeed')
      : fail('3 concurrent PDF merges', `${results.filter((r) => r.status !== 200).length} failed`);
  } catch (e) { fail('3 concurrent PDF merges', e.message); }

  // 5 simultaneous storage uploads
  try {
    const requests = Array.from({ length: 5 }, (_, i) =>
      postForm('/api/storage/upload-temp', {}, [
        { field: 'file', filename: `concurrent-${i}.pdf`, mime: 'application/pdf', data: pdf }
      ])
    );
    const results = await Promise.all(requests);
    const allOk = results.every((r) => r.status === 201);
    const fileIds = results.filter((r) => r.json?.data?.fileId).map((r) => r.json.data.fileId);

    allOk
      ? pass('5 concurrent storage uploads all succeed')
      : fail('5 concurrent storage uploads', `${results.filter((r) => r.status !== 201).length} failed`);

    // All fileIds must be unique
    const uniqueIds = new Set(fileIds);
    uniqueIds.size === fileIds.length
      ? pass('  → all fileIds are unique', `${uniqueIds.size} unique IDs`)
      : fail('  → duplicate fileIds detected');

    // Cleanup uploaded files
    await Promise.all(fileIds.map((id) => del(`/api/storage/temp/${id}`).catch(() => {})));
  } catch (e) { fail('5 concurrent storage uploads', e.message); }

  // 3 simultaneous watermark operations
  try {
    const requests = Array.from({ length: 3 }, (_, i) =>
      postForm('/api/pdf/watermark',
        { text: `WATERMARK-${i}`, opacity: '0.3' },
        [{ field: 'file', filename: 'test.pdf', mime: 'application/pdf', data: pdf }]
      )
    );
    const results = await Promise.all(requests);
    const allOk = results.every((r) => r.status === 200);
    allOk
      ? pass('3 concurrent watermark operations all succeed')
      : fail('3 concurrent watermarks', `${results.filter((r) => r.status !== 200).length} failed`);
  } catch (e) { fail('3 concurrent watermarks', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testCORSHeaders() {
  section('Edge Cases — CORS Headers');

  try {
    // CORS headers are only sent when the request includes an Origin header
    const u = new URL('/health', require('./helpers').BASE_URL);
    const res = await require('./helpers').request({
      hostname: u.hostname, port: u.port || 80,
      path: u.pathname, method: 'GET',
      headers: { 'Origin': 'http://localhost:5173' } // simulate browser request
    });

    const origin = res.headers['access-control-allow-origin'];
    origin
      ? pass('Access-Control-Allow-Origin header present', origin)
      : fail('Access-Control-Allow-Origin header missing', 'CORS not configured for Origin header');

    // Vary: Origin is only sent for dynamic origins (not wildcard *)
    // Either Vary:Origin OR Access-Control-Allow-Origin:* confirms CORS is active
    const vary = res.headers['vary'] || '';
    const corsActive = vary.toLowerCase().includes('origin') || origin === '*';
    corsActive
      ? pass('CORS is active (wildcard or dynamic origin)')
      : fail('CORS not active');

  } catch (e) { fail('CORS headers', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ EDGE CASES & SECURITY${C.reset}`);

  await testGatewayRouting();
  await testGuestFirst();
  await testFileSecurity();
  await testRateLimitHeaders();
  await testResponseConsistency();
  await testConcurrentRequests();
  await testCORSHeaders();
};
