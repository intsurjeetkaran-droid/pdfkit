import morgan from 'morgan';
import logger from './logger';

// Stream morgan output into winston logger
const stream = {
  write: (message: string) => {
    // Trim trailing newline that morgan adds
    logger.info(message.trim(), { type: 'http-request' });
  }
};

// Use 'combined' format in production, 'dev' format locally
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const requestLogger = morgan(format, { stream });
