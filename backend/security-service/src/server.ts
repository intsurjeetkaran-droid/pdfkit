import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import logger from './logger';

const PORT = parseInt(process.env.SECURITY_SERVICE_PORT || '3008', 10);

const server = app.listen(PORT, () => {
  logger.info(`Security Service running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down Security Service...`);
  server.close(() => {
    logger.info('Security Service closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Security Service', { reason });
  process.exit(1);
});

export default server;
