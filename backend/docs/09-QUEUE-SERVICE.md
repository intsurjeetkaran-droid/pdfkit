# Queue Service

**Port:** 3006  
**Version:** 2.0.0  
**Tests:** ✅ 75/75 passing

---

## Overview

Manages BullMQ queues and background workers. Exposes a REST API for job management and the Bull Board visual dashboard.

---

## Queues

| Queue | Concurrency | Purpose |
|-------|------------|---------|
| `pdf-jobs` | 3 | merge/split/rotate/watermark/reorder |
| `conversion-jobs` | 2 | office→pdf, pdf→word, pdf→image, image→pdf |
| `compression-jobs` | 2 | Ghostscript compression |
| `cleanup-jobs` | 1 | delete expired temp files |
| `organization-jobs` | 3 | reorder/duplicate/remove pages |
| `security-jobs` | 2 | protect/unlock/remove-metadata (planned) |
| `metadata-jobs` | 4 | info/page-count/preview (planned) |

---

## Bull Board Dashboard

Visual queue monitor at:

```
http://localhost:3006/admin/queues
```

Shows job counts, progress, failed jobs, and retry controls for all 7 queues.

---

## Health Check

```json
GET /health

{
  "status": "ok",
  "service": "queue-service",
  "timestamp": "2026-05-13T10:00:00.000Z",
  "dashboard": "/admin/queues"
}
```

---

## Routes

### POST /api/queue/jobs

Add a job to any queue.

**Request** `application/json`
```json
{
  "queue": "pdf-jobs",
  "name": "merge-pdf",
  "data": { "files": ["/path/a.pdf", "/path/b.pdf"] }
}
```

**Valid queue names:** `pdf-jobs`, `conversion-jobs`, `compression-jobs`, `cleanup-jobs`, `organization-jobs`, `security-jobs`, `metadata-jobs`

**Response** `201 Created`
```json
{
  "success": true,
  "data": { "jobId": "42", "queue": "pdf-jobs", "name": "merge-pdf" }
}
```

**Errors**
```json
400: { "success": false, "message": "queue, name, and data are required" }
400: { "success": false, "message": "Unknown queue: bad-queue. Valid queues: pdf-jobs, ..." }
```

---

### GET /api/queue/jobs/:queue/:id

Get the status and progress of a job.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "42",
    "name": "merge-pdf",
    "state": "completed",
    "progress": 100,
    "returnvalue": { "success": true, "elapsedMs": 312 },
    "failedReason": null,
    "attemptsMade": 1,
    "createdAt": "2026-05-13T10:00:00.000Z",
    "processedAt": "2026-05-13T10:00:00.050Z",
    "finishedAt": "2026-05-13T10:00:00.362Z"
  }
}
```

**Job states:** `waiting` | `active` | `completed` | `failed` | `delayed` | `paused`

**Errors**
```json
404: { "success": false, "message": "Job not found" }
400: { "success": false, "message": "Unknown queue: bad-queue" }
```

---

### GET /api/queue/stats

Job counts for all queues.

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "pdf-jobs":          { "waiting": 0, "active": 1, "completed": 42, "failed": 0 },
    "conversion-jobs":   { "waiting": 2, "active": 1, "completed": 18, "failed": 1 },
    "compression-jobs":  { "waiting": 0, "active": 0, "completed": 7,  "failed": 0 },
    "cleanup-jobs":      { "waiting": 0, "active": 0, "completed": 24, "failed": 0 },
    "organization-jobs": { "waiting": 0, "active": 0, "completed": 5,  "failed": 0 },
    "security-jobs":     { "waiting": 0, "active": 0, "completed": 0,  "failed": 0 },
    "metadata-jobs":     { "waiting": 0, "active": 0, "completed": 0,  "failed": 0 }
  }
}
```

---

### POST /api/queue/jobs/:queue/:id/retry

Retry a **failed** job. Only jobs in `failed` state can be retried.

**Response** `200 OK`
```json
{ "success": true, "message": "Job queued for retry" }
```

**Errors**
```json
400: { "success": false, "message": "Job 42 is in \"completed\" state. Only failed jobs can be retried." }
404: { "success": false, "message": "Job not found" }
400: { "success": false, "message": "Unknown queue: bad-queue" }
```

---

## Worker Logging

Each worker logs job start, per-step progress, and completion:

```
▶ conversion-job started  { jobId: "5", jobName: "pdf-to-word", inputPath: "..." }
  step: pdf-to-word via LibreOffice  { inputPath: "..." }
✔ conversion-job done     { jobId: "5", jobName: "pdf-to-word", elapsedMs: 9244 }
```

---

## Job Retry Policy

- Max attempts: **3**
- Backoff: **exponential** starting at 2 seconds
- Keep last 100 completed jobs
- Keep last 200 failed jobs (for debugging)
