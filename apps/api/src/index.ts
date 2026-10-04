import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { env } from './utils/env.js';

const app = express();
const PORT = parseInt(env.PORT, 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Readiness check endpoint
app.get('/ready', (_req, res) => {
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API routes
import { discoveryRouter } from './api/discovery.js';
import { replayRouter } from './api/replay.js';

app.use('/api/discovery', discoveryRouter);
app.use('/api/replay', replayRouter);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
