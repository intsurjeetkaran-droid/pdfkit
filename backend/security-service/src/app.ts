import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import securityRoutes from './routes/securityRoutes';
import logger from './logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// All security routes are public — no auth required
app.use('/api/security', securityRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'security-service',
    timestamp: new Date().toISOString(),
    note: 'Requires qpdf for protect/unlock operations'
  });
});

// Global error handler
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Security service error', { message: error.message, stack: error.stack });

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'File too large. Maximum size is 100MB' });
    return;
  }

  if (error.message?.startsWith('Only PDF files')) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

export default app;
