import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';

const PORT = parseInt(process.env.API_GATEWAY_PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`[API Gateway] Running on http://localhost:${PORT}`);
  console.log(`[API Gateway] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[API Gateway] Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown — close server on SIGTERM/SIGINT
const shutdown = (signal: string) => {
  console.log(`[API Gateway] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[API Gateway] Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('[API Gateway] Unhandled rejection:', reason);
  process.exit(1);
});

export default server;
