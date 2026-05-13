import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { allQueues } from './queues/queues';
import queueRoutes from './routes/queueRoutes';
import logger from './logger';

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP off for Bull Board UI
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─────────────────────────────────────────────
// Bull Board — visual queue dashboard at /admin/queues
// ─────────────────────────────────────────────
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: allQueues.map((q) => new BullMQAdapter(q)),
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());

// Queue API routes
app.use('/api/queue', queueRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'queue-service',
    timestamp: new Date().toISOString(),
    dashboard: '/admin/queues'
  });
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Queue service error', { message: error.message, stack: error.stack });
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

export default app;
