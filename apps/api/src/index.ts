import express from 'express';
import { logger } from './utils/logger.js';
import { env } from './utils/env.js';

const app = express();
const PORT = parseInt(env.PORT, 10);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Readiness check endpoint
app.get('/ready', (_req, res) => {
  // TODO: Add database connection check in Phase 2
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
