import { Router, Request, Response, NextFunction } from 'express';
import {
  pdfQueue,
  conversionQueue,
  compressionQueue,
  cleanupQueue,
  organizationQueue,
  securityQueue,
  metadataQueue
} from '../queues/queues';
import logger from '../logger';

const router = Router();

// Queue name → Queue instance map
const queueMap: Record<string, typeof pdfQueue> = {
  'pdf-jobs': pdfQueue,
  'conversion-jobs': conversionQueue,
  'compression-jobs': compressionQueue,
  'cleanup-jobs': cleanupQueue,
  'organization-jobs': organizationQueue,
  'security-jobs': securityQueue,
  'metadata-jobs': metadataQueue
};

// ─────────────────────────────────────────────
// ADD JOB: POST /api/queue/jobs
// Body: { queue, name, data }
// ─────────────────────────────────────────────
router.post('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue: queueName, name: jobName, data } = req.body;

    if (!queueName || !jobName || !data) {
      res.status(400).json({
        success: false,
        message: 'queue, name, and data are required'
      });
      return;
    }

    const targetQueue = queueMap[queueName];
    if (!targetQueue) {
      res.status(400).json({
        success: false,
        message: `Unknown queue: ${queueName}. Valid queues: ${Object.keys(queueMap).join(', ')}`
      });
      return;
    }

    const job = await targetQueue.add(jobName, data);
    logger.info('Job added to queue', { queue: queueName, jobName, jobId: job.id });

    res.status(201).json({
      success: true,
      message: 'Job added to queue',
      data: { jobId: job.id, queue: queueName, name: jobName }
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// GET JOB STATUS: GET /api/queue/jobs/:queue/:id
// ─────────────────────────────────────────────
router.get('/jobs/:queue/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue: queueName, id } = req.params;

    const targetQueue = queueMap[queueName];
    if (!targetQueue) {
      res.status(400).json({ success: false, message: `Unknown queue: ${queueName}` });
      return;
    }

    const job = await targetQueue.getJob(id);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    const state = await job.getState();
    const progress = job.progress;

    res.json({
      success: true,
      message: 'Job status fetched',
      data: {
        id: job.id,
        name: job.name,
        state,
        progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        createdAt: new Date(job.timestamp).toISOString(),
        processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// QUEUE STATS: GET /api/queue/stats
// ─────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await Promise.all(
      Object.entries(queueMap).map(async ([name, queue]) => ({
        name,
        counts: await queue.getJobCounts()
      }))
    );

    const data = counts.reduce((acc, { name, counts: c }) => {
      acc[name] = c;
      return acc;
    }, {} as Record<string, any>);

    res.json({ success: true, message: 'Queue stats fetched', data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// RETRY FAILED JOB: POST /api/queue/jobs/:queue/:id/retry
// ─────────────────────────────────────────────
router.post('/jobs/:queue/:id/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue: queueName, id } = req.params;

    const targetQueue = queueMap[queueName];
    if (!targetQueue) {
      res.status(400).json({ success: false, message: `Unknown queue: ${queueName}` });
      return;
    }

    const job = await targetQueue.getJob(id);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    // Only failed jobs can be retried
    const state = await job.getState();
    if (state !== 'failed') {
      res.status(400).json({
        success: false,
        message: `Job ${id} is in "${state}" state. Only failed jobs can be retried.`
      });
      return;
    }

    await job.retry();
    logger.info('Job retried', { queue: queueName, jobId: id });
    res.json({ success: true, message: 'Job queued for retry' });
  } catch (error) {
    next(error);
  }
});

export default router;
