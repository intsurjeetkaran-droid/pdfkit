/**
 * Queue Service — Logger
 * Pre-configured Winston logger with service name, pod identity, and file rotation.
 * Set POD_NAME env var via K8s Downward API for pod-level log tracing.
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import os from 'os';

const logsDir = path.resolve(process.cwd(), process.env.LOG_DIR || 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const cleanMeta = { ...meta };
    delete cleanMeta['service']; delete cleanMeta['pod'];
    delete cleanMeta['env']; delete cleanMeta['splat'];
    const metaStr = Object.keys(cleanMeta).length ? ' ' + JSON.stringify(cleanMeta) : '';
    return `${timestamp} [queue-service] ${level}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'queue-service',
    pod: process.env.POD_NAME || os.hostname(),
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : devFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'queue-service-error.log'),
      level: 'error', format: jsonFormat, maxsize: 10 * 1024 * 1024, maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'queue-service-combined.log'),
      format: jsonFormat, maxsize: 10 * 1024 * 1024, maxFiles: 10,
    }),
  ],
  exitOnError: false,
});

export default logger;
