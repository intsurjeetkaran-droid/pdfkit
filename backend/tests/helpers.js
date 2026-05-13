/**
 * tests/helpers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared utilities used by every test file:
 *   - HTTP request helper (no external deps — pure Node http module)
 *   - Multipart form-data builder
 *   - Minimal test file factories (PDF, PNG, DOCX, TXT)
 *   - Test result tracker
 *   - Console output helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const http  = require('http');
const https = require('https');

// ── Base URL ──────────────────────────────────────────────────────────────────
const BASE_URL  = process.env.BASE_URL  || 'http://localhost:3000';
const TIMEOUT   = parseInt(process.env.TEST_TIMEOUT || '30000', 10);

// ── ANSI colors ───────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
};

// ── Global result store ───────────────────────────────────────────────────────
const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

function pass(name, note = '') {
  results.passed++;
  results.tests.push({ name, passed: true, note });
  const n = note ? `${C.dim}  ${note}${C.reset}` : '';
  console.log(`  ${C.green}✓${C.reset} ${name}${n}`);
}

function fail(name, reason = '') {
  results.failed++;
  results.tests.push({ name, passed: false, reason });
  const r = reason ? `${C.red}  → ${reason}${C.reset}` : '';
  console.log(`  ${C.red}✗${C.reset} ${name}${r}`);
}

function skip(name, reason = '') {
  results.skipped++;
  results.tests.push({ name, passed: null, reason });
  console.log(`  ${C.yellow}⊘${C.reset} ${name}${reason ? `  (${reason})` : ''}`);
}

function section(title) {
  console.log(`\n${C.cyan}${C.bold}┌─ ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}┐${C.reset}`);
}

function info(msg) {
  console.log(`  ${C.blue}ℹ${C.reset} ${C.dim}${msg}${C.reset}`);
}

// ── HTTP request helper ───────────────────────────────────────────────────────
/**
 * Make an HTTP/HTTPS request.
 * Returns { status, headers, raw (string), json (parsed or null), buffer (Buffer) }
 */
function request(urlOrOptions, body = null) {
  return new Promise((resolve, reject) => {
    let options;

    if (typeof urlOrOptions === 'string') {
      const u = new URL(urlOrOptions);
      options = {
        hostname: u.hostname,
        port:     u.port || (u.protocol === 'https:' ? 443 : 80),
        path:     u.pathname + u.search,
        method:   'GET',
        protocol: u.protocol,
        headers:  {}
      };
    } else {
      options = { ...urlOrOptions };
      if (!options.protocol) options.protocol = 'http:';
      if (!options.headers)  options.headers  = {};
    }

    // Set Content-Length when sending a body
    if (body) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
      options.headers['Content-Length'] = buf.length;
      body = buf;
    }

    const lib = options.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const raw    = buffer.toString('utf8');
        let json = null;
        try { json = JSON.parse(raw); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, raw, json, buffer });
      });
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${TIMEOUT}ms`));
    });

    if (body) req.write(body);
    req.end();
  });
}

/** Convenience wrappers */
function get(path, headers = {}) {
  const u = new URL(path, BASE_URL);
  return request({
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search, method: 'GET',
    headers
  });
}

function del(path, headers = {}) {
  const u = new URL(path, BASE_URL);
  return request({
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search, method: 'DELETE',
    headers
  });
}

function postJSON(path, data, headers = {}) {
  const body = JSON.stringify(data);
  const u = new URL(path, BASE_URL);
  return request({
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search, method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers }
  }, body);
}

// ── Multipart form-data builder ───────────────────────────────────────────────
/**
 * Build a multipart/form-data body from fields and file attachments.
 *
 * fields: { fieldName: 'value', ... }
 * files:  [{ field, filename, mime, data: Buffer }]
 *
 * Returns { body: Buffer, contentType: string }
 */
function buildMultipart(fields = {}, files = []) {
  const boundary = `----PDFKitTestBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
  const CRLF = '\r\n';
  const parts = [];

  // Text fields
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }

  // File fields
  for (const { field, filename, mime, data } of files) {
    const header = Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${field}"; filename="${filename}"${CRLF}` +
      `Content-Type: ${mime}${CRLF}${CRLF}`
    );
    const footer = Buffer.from(CRLF);
    parts.push(header, Buffer.isBuffer(data) ? data : Buffer.from(data), footer);
  }

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  return {
    body:        Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

/** POST multipart/form-data */
function postForm(path, fields = {}, files = []) {
  const { body, contentType } = buildMultipart(fields, files);
  const u = new URL(path, BASE_URL);
  return request({
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search, method: 'POST',
    headers: { 'Content-Type': contentType }
  }, body);
}

// ── Test file factories ───────────────────────────────────────────────────────

/** Minimal valid single-page PDF (real structure, passes pdf-lib validation) */
function makePDF() {
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]' +
    '/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    '4 0 obj<</Length 44>>stream\n' +
    'BT /F1 12 Tf 100 700 Td (PDFKit Test) Tj ET\n' +
    'endstream\nendobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'xref\n0 6\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    '0000000317 00000 n \n' +
    '0000000410 00000 n \n' +
    'trailer<</Size 6/Root 1 0 R>>\n' +
    'startxref\n490\n%%EOF'
  );
}

/**
 * A proper pdf-lib generated PDF — required for tools like qpdf that
 * validate PDF structure more strictly than pdf-lib itself.
 * This is a synchronous approximation using the same bytes pdf-lib produces.
 * The actual bytes were captured from a real pdf-lib output (584 bytes).
 */
function makeProperPDF() {
  // Real pdf-lib generated single-page PDF (584 bytes, captured from container)
  // Passes qpdf's strict validation — use this for security service tests
  return Buffer.from(
    'JVBERi0xLjcKJYGBgYEKCjUgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA0' +
    'Ci9GaXJzdCAyMAovTGVuZ3RoIDI2OQo+PgpzdHJlYW0KeJzVkk1rxCAQhu/+ijm2l3U0xpgSAtt8XEphWXrq0oNs' +
    'ZAmUdTEJtP++Y9y29FB6LvJidJ7JqO8IQJCgFGRQGFCQZxKqivGn94sDvrMnNzH+MA4THCiKsIcXxhu/nGcQrK7Z' +
    'N9vY2b76E0tJICL8SeyCH5ajC1D1Xd8jFoioFUkjypbmhlSSJK0pJg19kwp1Fe0VGWK2pVifpIuUE+Mrm1/zO5qJ' +
    '1ZFpE6tMWn/VjbW69A/513nKmvFHP7R2dnDT3kmUGnORCUllyudbeo7g7Oz/7+XW84/+/OsNf/gc7Y0mBxd7YHWZ' +
    '793kl3Ak24mr43u5YbT3/o26BmnkZb6RBowSG1NSBxHyAZf2jyMKZW5kc3RyZWFtCmVuZG9iagoKNiAwIG9iago8' +
    'PAovU2l6ZSA3Ci9Sb290IDIgMCBSCi9JbmZvIDMgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9UeXBlIC9YUmVm' +
    'Ci9MZW5ndGggMzQKL1cgWyAxIDIgMiBdCi9JbmRleCBbIDAgNyBdCj4+CnN0cmVhbQp4nBXEMQ4AIAgEsB7G3T/7' +
    'cAgdiu5y2bLVduKRfAZDpAK3CmVuZHN0cmVhbQplbmRvYmoKCnN0YXJ0eHJlZgozODcKJSVFT0Y=',
    'base64'
  );
}

/** Minimal valid 1×1 transparent PNG */
function makePNG() {
  return Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
    0x08,0x06,0x00,0x00,0x00,0x1F,0x15,0xC4,
    0x89,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,
    0x54,0x78,0x9C,0x63,0x00,0x01,0x00,0x00,
    0x05,0x00,0x01,0x0D,0x0A,0x2D,0xB4,0x00,
    0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,
    0x42,0x60,0x82
  ]);
}

/** Fake DOCX (PK header — enough to pass MIME check) */
function makeDOCX() {
  return Buffer.from('PK\x03\x04fake docx content for route testing');
}

/** Fake XLSX */
function makeXLSX() {
  return Buffer.from('PK\x03\x04fake xlsx content for route testing');
}

/** Fake PPTX */
function makePPTX() {
  return Buffer.from('PK\x03\x04fake pptx content for route testing');
}

/** Plain text — used for wrong-MIME-type edge cases */
function makeTXT() {
  return Buffer.from('This is not a PDF file.');
}

/** Corrupt/truncated PDF — used for malformed file edge cases */
function makeCorruptPDF() {
  return Buffer.from('%PDF-1.4\nthis is intentionally corrupt and incomplete');
}

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── isPDF check ───────────────────────────────────────────────────────────────
/** Returns true if the buffer starts with the PDF magic bytes */
function isPDFBuffer(buf) {
  if (!buf || buf.length < 4) return false;
  return buf.slice(0, 4).toString() === '%PDF';
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  BASE_URL,
  C,
  results,
  pass, fail, skip, section, info,
  request, get, del, postJSON, postForm, buildMultipart,
  makePDF, makeProperPDF, makePNG, makeDOCX, makeXLSX, makePPTX, makeTXT, makeCorruptPDF,
  sleep, isPDFBuffer
};
