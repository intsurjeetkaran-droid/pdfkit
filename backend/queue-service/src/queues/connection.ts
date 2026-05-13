import Redis from 'ioredis';
import logger from '../logger';

// Shared Redis connection for all BullMQ queues and workers
export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false
});

redisConnection.on('connect', () => {
  logger.info('Redis connected');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

redisConnection.on('close', () => {
  logger.warn('Redis connection closed');
});
