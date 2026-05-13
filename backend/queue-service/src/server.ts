import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import logger from './logger';
import { startPdfWorker } from './workers/pdfWorker';
import { startConversionWorker } from './workers/conversionWorker';
import { startCleanupWorker } from './workers/cleanupWorker';

const PORT = parseInt(process.env.QUEUE_SERVICE_PORT || '3006', 10);

const server = app.listen(PORT, () => {
  logger.info(`Queue Service running on http://localhost:${PORT}`);
  logger.info(`Bull Board dashboard: http://localhost:${PORT}/admin/queues`);
  logger.info(`Health check: http://localhost:${PORT}/health`);

  // Start all background workers
  startPdfWorker();
  startConversionWorker();
  startCleanupWorker();

  logger.info('All workers started');
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down Queue Service...`);
  server.close(() => {
    logger.info('Queue Service closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Queue Service', { reason });
  process.exit(1);
});

export default server;
