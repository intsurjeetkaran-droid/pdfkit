/**
 * tests/06-queue.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Queue Service — complete test coverage
 *
 * Happy path:
 *   GET /api/queue/stats — all 7 queues present with correct structure
 *   POST /api/queue/jobs — add job to each valid queue
 *   GET /api/queue/jobs/:queue/:id — get job status, validate all fields
 *   POST /api/queue/jobs/:queue/:id/retry — retry a job
 *   GET /admin/queues — Bull Board dashboard accessible
 *
 * Edge cases:
 *   POST /api/queue/jobs with unknown queue → 400
 *   POST /api/queue/jobs missing queue field → 400
 *   POST /api/queue/jobs missing name field → 400
 *   POST /api/queue/jobs missing data field → 400
 *   GET /api/queue/jobs/:queue/:id with unknown queue → 400
 *   GET /api/queue/jobs/:queue/:id with non-existent job → 404
 *   GET /api/queue/stats — each queue has waiting/active/completed/failed counts
 *   job state is one of the valid states
 *   job progress is a number 0–100
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const {
  pass, fail, skip, section, info,
  get, postJSON, request,
  C
} = require('./helpers');

const VALID_QUEUES = [
  'pdf-jobs',
  'conversion-jobs',
  'compression-jobs',
  'cleanup-jobs',
  'organization-jobs',
  'security-jobs',
  'metadata-jobs'
];

const VALID_JOB_STATES = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'];

// ─────────────────────────────────────────────────────────────────────────────
async function testQueueStats() {
  section('Queue — GET /api/queue/stats');

  try {
    const res = await get('/api/queue/stats');
    if (res.status !== 200 || !res.json?.success) {
      fail('GET /api/queue/stats → 200', `status ${res.status}`);
      return;
    }
    pass('GET /api/queue/stats → 200');

    const data = res.json.data || {};
    const foundQueues = Object.keys(data);

    // All 7 queues must be registered
    for (const q of VALID_QUEUES) {
      foundQueues.includes(q)
        ? pass(`  → queue "${q}" registered`)
        : fail(`  → queue "${q}" missing`);
    }

    // Each queue must have the correct count fields
    for (const [qName, counts] of Object.entries(data)) {
      const requiredFields = ['waiting', 'active', 'completed', 'failed'];
      for (const field of requiredFields) {
        typeof counts[field] === 'number'
          ? pass(`  → ${qName}.${field} is a number`, String(counts[field]))
          : fail(`  → ${qName}.${field} missing or not a number`);
      }
    }

  } catch (e) { fail('GET /api/queue/stats', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testAddJob() {
  section('Queue — POST /api/queue/jobs');

  const jobIds = {};

  // Happy: add a job to each valid queue
  for (const queue of VALID_QUEUES) {
    try {
      const res = await postJSON('/api/queue/jobs', {
        queue,
        name: 'test-job',
        data: { test: true, queue, timestamp: Date.now() }
      });

      if (res.status === 201 && res.json?.success && res.json?.data?.jobId) {
        jobIds[queue] = res.json.data.jobId;
        pass(`Add job to "${queue}" → 201`, `jobId: ${jobIds[queue]}`);

        // Validate response shape
        res.json.data.queue === queue
          ? pass(`  → response.queue matches "${queue}"`)
          : fail(`  → response.queue mismatch`, `got ${res.json.data.queue}`);
        res.json.data.name === 'test-job'
          ? pass('  → response.name correct')
          : fail('  → response.name wrong', res.json.data.name);
      } else {
        fail(`Add job to "${queue}" → 201`, `status ${res.status}: ${res.raw.slice(0, 80)}`);
      }
    } catch (e) { fail(`Add job to "${queue}"`, e.message); }
  }

  return jobIds;
}

// ─────────────────────────────────────────────────────────────────────────────
async function testGetJobStatus(jobIds) {
  section('Queue — GET /api/queue/jobs/:queue/:id');

  if (!jobIds || Object.keys(jobIds).length === 0) {
    skip('Get job status', 'no jobIds from add-job tests');
    return;
  }

  // Test with pdf-jobs job
  const queue = 'pdf-jobs';
  const jobId = jobIds[queue];

  if (!jobId) { skip('Get job status (pdf-jobs)', 'no jobId'); return; }

  try {
    const res = await get(`/api/queue/jobs/${queue}/${jobId}`);
    if (res.status === 200 && res.json?.success) {
      pass(`GET /api/queue/jobs/${queue}/${jobId} → 200`);

      const d = res.json.data;

      // id
      d.id ? pass('  → id present', d.id) : fail('  → id missing');

      // name
      d.name ? pass('  → name present', d.name) : fail('  → name missing');

      // state must be a valid state
      VALID_JOB_STATES.includes(d.state)
        ? pass('  → state is valid', d.state)
        : fail('  → state is invalid', `got "${d.state}"`);

      // progress must be 0–100
      typeof d.progress === 'number' && d.progress >= 0 && d.progress <= 100
        ? pass('  → progress is 0–100', String(d.progress))
        : fail('  → progress out of range', String(d.progress));

      // createdAt must be a valid ISO date
      d.createdAt && !isNaN(new Date(d.createdAt).getTime())
        ? pass('  → createdAt is valid ISO date', d.createdAt)
        : fail('  → createdAt invalid', d.createdAt);

    } else {
      fail(`GET job status → 200`, `status ${res.status}`);
    }
  } catch (e) { fail('GET job status', e.message); }

  // Non-existent job → 404
  try {
    const res = await get(`/api/queue/jobs/${queue}/999999999`);
    res.status === 404
      ? pass('GET non-existent job → 404')
      : fail('GET non-existent job', `expected 404, got ${res.status}`);
  } catch (e) { fail('GET non-existent job → 404', e.message); }

  // Unknown queue → 400
  try {
    const res = await get('/api/queue/jobs/nonexistent-queue/1');
    res.status === 400
      ? pass('GET job with unknown queue → 400')
      : fail('GET job with unknown queue', `expected 400, got ${res.status}`);
  } catch (e) { fail('GET job with unknown queue → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testAddJobEdgeCases() {
  section('Queue — POST /api/queue/jobs Edge Cases');

  // Unknown queue → 400
  try {
    const res = await postJSON('/api/queue/jobs', {
      queue: 'nonexistent-queue',
      name: 'test',
      data: {}
    });
    res.status === 400
      ? pass('Add job to unknown queue → 400')
      : fail('Add job to unknown queue', `expected 400, got ${res.status}`);
  } catch (e) { fail('Add job to unknown queue → 400', e.message); }

  // Missing queue field → 400
  try {
    const res = await postJSON('/api/queue/jobs', { name: 'test', data: {} });
    res.status === 400
      ? pass('Add job missing queue → 400')
      : fail('Add job missing queue', `expected 400, got ${res.status}`);
  } catch (e) { fail('Add job missing queue → 400', e.message); }

  // Missing name field → 400
  try {
    const res = await postJSON('/api/queue/jobs', { queue: 'pdf-jobs', data: {} });
    res.status === 400
      ? pass('Add job missing name → 400')
      : fail('Add job missing name', `expected 400, got ${res.status}`);
  } catch (e) { fail('Add job missing name → 400', e.message); }

  // Missing data field → 400
  try {
    const res = await postJSON('/api/queue/jobs', { queue: 'pdf-jobs', name: 'test' });
    res.status === 400
      ? pass('Add job missing data → 400')
      : fail('Add job missing data', `expected 400, got ${res.status}`);
  } catch (e) { fail('Add job missing data → 400', e.message); }

  // Empty body → 400
  try {
    const res = await postJSON('/api/queue/jobs', {});
    res.status === 400
      ? pass('Add job empty body → 400')
      : fail('Add job empty body', `expected 400, got ${res.status}`);
  } catch (e) { fail('Add job empty body → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testRetryJob(jobIds) {
  section('Queue — POST /api/queue/jobs/:queue/:id/retry');

  const queue = 'pdf-jobs';
  const jobId = jobIds?.[queue];

  if (!jobId) { skip('Retry job', 'no jobId available'); return; }

  // Retry a job (completed jobs → 400 with clear message; failed jobs → 200)
  try {
    const res = await postJSON(`/api/queue/jobs/${queue}/${jobId}/retry`, {});
    (res.status === 200 || res.status === 400)
      ? pass(`Retry job ${jobId} → ${res.status}`, res.json?.message || '')
      : fail('Retry job', `unexpected status ${res.status}`);
  } catch (e) { fail('Retry job', e.message); }

  // Retry non-existent job → 404
  try {
    const res = await postJSON(`/api/queue/jobs/${queue}/999999999/retry`, {});
    res.status === 404
      ? pass('Retry non-existent job → 404')
      : fail('Retry non-existent job', `expected 404, got ${res.status}`);
  } catch (e) { fail('Retry non-existent job → 404', e.message); }

  // Retry with unknown queue → 400
  try {
    const res = await postJSON('/api/queue/jobs/bad-queue/1/retry', {});
    res.status === 400
      ? pass('Retry with unknown queue → 400')
      : fail('Retry with unknown queue', `expected 400, got ${res.status}`);
  } catch (e) { fail('Retry with unknown queue → 400', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
async function testBullBoard() {
  section('Queue — Bull Board Dashboard');

  try {
    const res = await request({
      hostname: 'localhost', port: 3006,
      path: '/admin/queues', method: 'GET', headers: {}
    });
    if (res.status === 200) {
      pass('GET /admin/queues (Bull Board) → 200', 'port 3006');
      // Should return HTML
      res.raw.includes('<html') || res.raw.includes('<!DOCTYPE')
        ? pass('  → response is HTML')
        : info('  → response may not be HTML (check manually)');
    } else {
      fail('GET /admin/queues (Bull Board)', `status ${res.status}`);
    }
  } catch (e) { fail('GET /admin/queues (Bull Board)', e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function run() {
  console.log(`\n${C.bold}${C.magenta}▶ QUEUE SERVICE${C.reset}`);

  await testQueueStats();
  const jobIds = await testAddJob();
  await testGetJobStatus(jobIds);
  await testAddJobEdgeCases();
  await testRetryJob(jobIds);
  await testBullBoard();
};
