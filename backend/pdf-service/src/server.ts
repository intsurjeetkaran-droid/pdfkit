import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import logger from './logger';

const PORT = parseInt(process.env.PDF_SERVICE_PORT || '3001', 10);

const server = app.listen(PORT, () => {
  logger.info(`PDF Service running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down PDF Service...`);
  server.close(() => {
    logger.info('PDF Service closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in PDF Service', { reason });
  process.exit(1);
});

export default server;
