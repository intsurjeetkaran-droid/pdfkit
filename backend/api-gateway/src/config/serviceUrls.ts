import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Downstream service base URLs — used by the proxy middleware
export const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3004',
  pdf: process.env.PDF_SERVICE_URL || 'http://localhost:3001',
  conversion: process.env.CONVERSION_SERVICE_URL || 'http://localhost:3002',
  storage: process.env.STORAGE_SERVICE_URL || 'http://localhost:3003',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3005',
  queue: process.env.QUEUE_SERVICE_URL || 'http://localhost:3006',
  organization: process.env.ORGANIZATION_SERVICE_URL || 'http://localhost:3007',
  security: process.env.SECURITY_SERVICE_URL || 'http://localhost:3008',
  metadata: process.env.METADATA_SERVICE_URL || 'http://localhost:3009'
} as const;
