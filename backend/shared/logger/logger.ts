/**
 * =============================================================================
 * PDFKit — Global Logger Factory
 * =============================================================================
 *
 * Creates a Winston logger instance for a named service.
 * Every log entry includes:
 *   - timestamp (ISO 8601 with milliseconds)
 *   - service name (e.g. "pdf-service", "api-gateway")
 *   - pod/hostname (useful in Kubernetes to identify which pod logged)
 *   - log level
 *   - message
 *   - any extra metadata passed as the second argument
 *
 * USAGE:
 *   import { createLogger } from '../../shared/logger/logger';
 *   const logger = createLogger('pdf-service');
 *   logger.info('merge started', { fileCount: 3 });
 *   logger.error('merge failed', { error: err.message, stack: err.stack });
 *
 * LOG LEVELS (Winston standard):
 *   error   — unrecoverable errors, service failures
 *   warn    — recoverable issues, degraded behavior
 *   info    — normal operation events (start, done, health checks)
 *   http    — HTTP request/response logs (Morgan output)
 *   debug   — detailed diagnostic info (disabled in production)
 *
 * OUTPUT:
 *   Console: colorized human-readable in development, JSON in production
 *   Files:   <service>-error.log (errors only) + <service>-combined.log (all)
 *            Located in ./logs/ relative to the service's working directory
 *
 * KUBERNETES:
 *   In K8s, stdout/stderr are collected by the node's log driver (e.g. fluentd,
 *   Loki, CloudWatch). The JSON console format makes log aggregation easy.
 *   File transports are secondary — useful for local debugging.
 * =============================================================================
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ── Log directory ─────────────────────────────────────────────────────────────
// Resolved relative to the process working directory (each service's root).
const logsDir = path.resolve(process.cwd(), process.env.LOG_DIR || 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── JSON format for files and production console ──────────────────────────────
// Structured JSON makes logs parseable by log aggregators (Loki, CloudWatch, etc.)
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ── Human-readable format for development console ─────────────────────────────
const devConsoleFormat = (serviceName: string) =>
  winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, service, pod, ...meta }) => {
      // Filter out internal Winston fields from the meta display
      const cleanMeta = { ...meta };
      delete cleanMeta['splat'];
      const metaStr = Object.keys(cleanMeta).length
        ? ' ' + JSON.stringify(cleanMeta)
        : '';
      return `${timestamp} [${service || serviceName}] ${level}: ${message}${metaStr}`;
    })
  );

/**
 * Create a logger for a specific service.
 *
 * @param serviceName - Service identifier (e.g. "pdf-service", "api-gateway")
 * @returns           - Configured Winston logger instance
 */
export function createLogger(serviceName: string): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',

    // Default metadata attached to EVERY log entry automatically.
    // In Kubernetes, pod name and node name help identify which instance logged.
    defaultMeta: {
      service: serviceName,
      pod: process.env.POD_NAME || os.hostname(),   // K8s pod name via Downward API
      env: process.env.NODE_ENV || 'development',
    },

    transports: [
      // ── Console transport ─────────────────────────────────────────────────
      // JSON in production (for log aggregators), colorized in development
      new winston.transports.Console({
        format: isProduction ? jsonFormat : devConsoleFormat(serviceName),
      }),

      // ── Error log file ────────────────────────────────────────────────────
      // Only error-level logs. Rotated at 10MB, keeps last 5 files.
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-error.log`),
        level: 'error',
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024,  // 10MB per file
        maxFiles: 5,
      }),

      // ── Combined log file ─────────────────────────────────────────────────
      // All log levels. Rotated at 10MB, keeps last 10 files.
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-combined.log`),
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024,  // 10MB per file
        maxFiles: 10,
      }),
    ],

    // Prevent Winston from crashing the process on uncaught exceptions.
    // The process-level handlers in server.ts handle those.
    exitOnError: false,
  });
}

/**
 * Create a Morgan stream adapter for piping HTTP request logs into Winston.
 *
 * @param logger - Winston logger instance
 * @returns      - Stream object compatible with Morgan's `stream` option
 */
export function createMorganStream(logger: winston.Logger) {
  return {
    write: (message: string) => {
      // Morgan adds a trailing newline — trim it before logging
      logger.http(message.trim());
    },
  };
}

// ── Default logger (for shared utilities that need a logger) ──────────────────
// Services should use createLogger('service-name') instead of this.
const defaultLogger = createLogger('pdfkit');
export default defaultLogger;
