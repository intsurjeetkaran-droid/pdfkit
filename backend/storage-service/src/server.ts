import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import logger from './logger';
import { startCleanupScheduler } from './services/cleanupScheduler';

const PORT = parseInt(process.env.STORAGE_SERVICE_PORT || '3003', 10);

const server = app.listen(PORT, () => {
  logger.info(`Storage Service running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);

  // Start automatic temp file cleanup every hour
  startCleanupScheduler();
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down Storage Service...`);
  server.close(() => {
    logger.info('Storage Service closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Storage Service', { reason });
  process.exit(1);
});

export default server;
