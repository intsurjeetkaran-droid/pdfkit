import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import htmlRoutes from './routes/htmlRoutes';
import logger from './logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow large HTML strings in body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// All HTML routes are public — no auth required
app.use('/api/html', htmlRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'html-service',
    timestamp: new Date().toISOString(),
    note: 'Requires Chromium (puppeteer-core) for HTML/URL to PDF conversion'
  });
});

// Global error handler
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('HTML service error', { message: error.message, stack: error.stack });

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB' });
    return;
  }

  if (error.message?.startsWith('Only HTML files')) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

export default app;
