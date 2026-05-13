import { Worker, Job } from 'bullmq';
import fs from 'fs';
import { redisConnection } from '../queues/connection';
import logger from '../logger';

/**
 * Cleanup Worker — processes the 'cleanup-jobs' queue.
 *
 * Job payload: { filePaths: string[] }
 * Each job receives a list of absolute file paths to delete.
 * Runs with concurrency 1 to avoid I/O spikes on the storage volume.
 */
export const startCleanupWorker = (): Worker => {
  const worker = new Worker(
    'cleanup-jobs',
    async (job: Job) => {
      const startMs = Date.now();
      logger.info('▶ cleanup-job started', { jobId: job.id, jobName: job.name });

      if (job.name !== 'cleanup-temp') {
        logger.warn('Unknown cleanup job name — skipping', { jobName: job.name });
        return { skipped: true };
      }

      const { filePaths } = job.data as { filePaths: string[] };
      let deleted = 0;
      let skipped = 0;  // file already gone
      let failed  = 0;  // permission / lock error

      for (const filePath of filePaths) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted++;
            logger.debug('Deleted file', { filePath });
          } else {
            skipped++;
          }
        } catch (err) {
          failed++;
          logger.warn('Failed to delete file', { filePath, error: (err as Error).message });
        }
      }

      const elapsedMs = Date.now() - startMs;
      logger.info('✔ cleanup-job done', {
        jobId: job.id,
        total: filePaths.length,
        deleted,
        skipped,
        failed,
        elapsedMs
      });

      return { deleted, skipped, failed, elapsedMs };
    },
    {
      connection: redisConnection,
      concurrency: 1  // sequential — avoids I/O spikes
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Cleanup job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('Cleanup worker started — listening on cleanup-jobs');
  return worker;
};
