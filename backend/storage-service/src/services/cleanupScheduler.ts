import { cleanupExpiredFiles } from './storageService';
import logger from '../logger';

const INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || String(60 * 60 * 1000), 10);

// Run expired file cleanup on a schedule
export const startCleanupScheduler = (): void => {
  logger.info('Cleanup scheduler started', { intervalMs: INTERVAL_MS });

  // Run immediately on startup to clean any leftover files
  cleanupExpiredFiles()
    .then((count) => logger.info('Initial cleanup done', { deletedCount: count }))
    .catch((err) => logger.error('Initial cleanup failed', { error: err }));

  setInterval(async () => {
    logger.info('Running scheduled expired file cleanup');
    try {
      const count = await cleanupExpiredFiles();
      logger.info('Scheduled cleanup done', { deletedCount: count });
    } catch (error) {
      logger.error('Scheduled cleanup failed', { error });
    }
  }, INTERVAL_MS);
};
