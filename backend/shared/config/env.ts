import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root regardless of which service is running
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  ports: {
    apiGateway: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
    pdfService: parseInt(process.env.PDF_SERVICE_PORT || '3001', 10),
    conversionService: parseInt(process.env.CONVERSION_SERVICE_PORT || '3002', 10),
    storageService: parseInt(process.env.STORAGE_SERVICE_PORT || '3003', 10),
    authService: parseInt(process.env.AUTH_SERVICE_PORT || '3004', 10),
    userService: parseInt(process.env.USER_SERVICE_PORT || '3005', 10),
    queueService: parseInt(process.env.QUEUE_SERVICE_PORT || '3006', 10)
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  database: {
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/pdfkit'
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    outputDir: process.env.OUTPUT_DIR || 'outputs',
    tempDir: process.env.TEMP_DIR || 'temp'
  }
};
