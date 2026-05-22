/**
 * API Gateway — Logger
 *
 * Winston logger pre-configured for the api-gateway service.
 * Every log entry includes:
 *   - service: "api-gateway"
 *   - pod: hostname (K8s pod name when POD_NAME env var is set)
 *   - timestamp with milliseconds
 *
 * In Kubernetes, set the POD_NAME env var via the Downward API:
 *   env:
 *     - name: POD_NAME
 *       valueFrom:
 *         fieldRef:
 *           fieldPath: metadata.name
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import os from 'os';

const logsDir = path.resolve(process.cwd(), process.env.LOG_DIR || 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// JSON format — used for file transports and production console
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Colorized format — used for development console
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const cleanMeta = { ...meta };
    delete cleanMeta['service'];
    delete cleanMeta['pod'];
    delete cleanMeta['env'];
    delete cleanMeta['splat'];
    const metaStr = Object.keys(cleanMeta).length ? ' ' + JSON.stringify(cleanMeta) : '';
    return `${timestamp} [api-gateway] ${level}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  // Metadata automatically attached to every log entry
  defaultMeta: {
    service: 'api-gateway',
    pod: process.env.POD_NAME || os.hostname(),
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : devFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'api-gateway-error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'api-gateway-combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
  exitOnError: false,
});

export default logger;
