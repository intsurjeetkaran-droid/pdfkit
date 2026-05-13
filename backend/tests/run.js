#!/usr/bin/env node
/**
 * tests/run.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PDFKit v2.0 — Complete Backend Test Runner
 *
 * Runs all test files in order and prints a unified summary.
 *
 * Usage:
 *   node tests/run.js              — run all tests
 *   node tests/run.js --only 03    — run only test file 03-pdf
 *   node tests/run.js --skip 01    — skip infrastructure (faster)
 *   node tests/run.js --verbose    — show pass notes too
 *
 * Requirements:
 *   docker-compose up --build -d   (run first)
 *   node >= 20
 *   No npm install needed — uses only Node built-ins
 *
 * Test files:
 *   01-infrastructure  Docker, MySQL, Redis, health endpoints, gateway
 *   02-storage         Upload, download, delete, stats, cleanup, edge cases
 *   03-pdf             Merge, split, rotate, extract, delete, reorder, watermark
 *   04-conversion      image-to-pdf, pdf-to-image, compress, office routes, pdf-to-word
 *   05-organization    Reorder, duplicate, remove pages
 *   06-queue           Stats, add job, get status, retry, Bull Board
 *   07-edge-cases      Security, guest-first, concurrent, response shape, CORS
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');
const { results, C } = require('./helpers');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const skipArg = args.includes('--skip') ? args[args.indexOf('--skip') + 1] : null;

// ── Test files in execution order ─────────────────────────────────────────────
const TEST_FILES = [
  { id: '01', file: './01-infrastructure.test.js', name: 'Infrastructure & Health' },
  { id: '02', file: './02-storage.test.js',        name: 'Storage Service' },
  { id: '03', file: './03-pdf.test.js',            name: 'PDF Service' },
  { id: '04', file: './04-conversion.test.js',     name: 'Conversion Service' },
  { id: '05', file: './05-organization.test.js',   name: 'Organization Service' },
  { id: '06', file: './06-queue.test.js',          name: 'Queue Service' },
  { id: '07', file: './07-edge-cases.test.js',     name: 'Edge Cases & Security' },
  { id: '08', file: './08-security.test.js',       name: 'Security Service' },
  { id: '09', file: './09-metadata.test.js',       name: 'Metadata Service' }
];

// ── Filter by --only / --skip ─────────────────────────────────────────────────
const filesToRun = TEST_FILES.filter(({ id }) => {
  if (onlyArg && !id.startsWith(onlyArg)) return false;
  if (skipArg &&  id.startsWith(skipArg)) return false;
  return true;
});

// ── Per-file result snapshots ─────────────────────────────────────────────────
const fileResults = [];

// ── Header ────────────────────────────────────────────────────────────────────
function printHeader() {
  const line = '═'.repeat(64);
  console.log(`\n${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  PDFKit v2.0 — Complete Backend Test Suite${C.reset}`);
  console.log(`${C.bold}${C.cyan}  Guest-First · No Auth Required · ${filesToRun.length} test files${C.reset}`);
  console.log(`${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.dim}  Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}${C.reset}`);
  console.log(`${C.dim}  Timeout:  ${process.env.TEST_TIMEOUT || '30000'}ms per request${C.reset}`);
  if (onlyArg) console.log(`${C.yellow}  Filter:   --only ${onlyArg}${C.reset}`);
  if (skipArg) console.log(`${C.yellow}  Filter:   --skip ${skipArg}${C.reset}`);
}

// ── Final summary ─────────────────────────────────────────────────────────────
function printSummary(totalMs) {
  const line = '═'.repeat(64);
  const total   = results.passed + results.failed + results.skipped;
  const passRate = total > 0
    ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    : '0.0';

  console.log(`\n${C.bold}${line}${C.reset}`);
  console.log(`${C.bold}  FINAL RESULTS${C.reset}`);
  console.log(`${C.bold}${line}${C.reset}\n`);

  // Per-file breakdown
  console.log(`${C.bold}  Per-file breakdown:${C.reset}`);
  for (const { name, passed, failed, skipped } of fileResults) {
    const icon   = failed === 0 ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
    const counts = `${C.green}${passed}p${C.reset} ${C.red}${failed}f${C.reset} ${C.yellow}${skipped}s${C.reset}`;
    console.log(`  ${icon} ${name.padEnd(32)} ${counts}`);
  }

  console.log();
  console.log(`  Total tests:  ${total}`);
  console.log(`${C.green}  Passed:       ${results.passed}${C.reset}`);
  console.log(`${C.red}  Failed:       ${results.failed}${C.reset}`);
  console.log(`${C.yellow}  Skipped:      ${results.skipped}${C.reset}`);
  console.log(`  Pass rate:    ${passRate}%`);
  console.log(`  Duration:     ${(totalMs / 1000).toFixed(1)}s`);

  // Failed test list
  if (results.failed > 0) {
    console.log(`\n${C.red}${C.bold}  Failed tests:${C.reset}`);
    results.tests
      .filter((t) => t.passed === false)
      .forEach((t) => {
        const reason = t.reason ? `: ${t.reason}` : '';
        console.log(`${C.red}    ✗ ${t.name}${reason}${C.reset}`);
      });
  }

  // Useful links
  console.log(`\n${C.cyan}  Bull Board:   http://localhost:3006/admin/queues${C.reset}`);
  console.log(`${C.cyan}  API Gateway:  http://localhost:3000/health${C.reset}`);
  console.log();

  // Final verdict
  if (results.failed === 0) {
    console.log(`${C.green}${C.bold}  ✅ ALL TESTS PASSED${C.reset}\n`);
  } else {
    console.log(`${C.red}${C.bold}  ❌ ${results.failed} TEST(S) FAILED${C.reset}\n`);
  }

  console.log(`${C.bold}${line}${C.reset}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  printHeader();

  const startTime = Date.now();

  for (const { id, file, name } of filesToRun) {
    // Snapshot results before this file runs
    const before = {
      passed:  results.passed,
      failed:  results.failed,
      skipped: results.skipped
    };

    try {
      const testModule = require(path.resolve(__dirname, file));
      await testModule();
    } catch (err) {
      console.log(`\n${C.red}  ✗ Test file ${file} threw an uncaught error:${C.reset}`);
      console.error(`  ${err.message}`);
      results.failed++;
      results.tests.push({ name: `[${file} crashed]`, passed: false, reason: err.message });
    }

    // Record per-file delta
    fileResults.push({
      name,
      passed:  results.passed  - before.passed,
      failed:  results.failed  - before.failed,
      skipped: results.skipped - before.skipped
    });
  }

  const totalMs = Date.now() - startTime;
  printSummary(totalMs);

  process.exit(results.failed === 0 ? 0 : 1);
}

process.on('unhandledRejection', (err) => {
  console.error(`\n${C.red}Unhandled rejection:${C.reset}`, err);
  process.exit(1);
});

main();
