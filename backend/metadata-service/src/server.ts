import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import logger from './logger';

const PORT = parseInt(process.env.METADATA_SERVICE_PORT || '3009', 10);

const server = app.listen(PORT, () => {
  logger.info(`Metadata Service running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down Metadata Service...`);
  server.close(() => {
    logger.info('Metadata Service closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Metadata Service', { reason });
  process.exit(1);
});

export default server;
