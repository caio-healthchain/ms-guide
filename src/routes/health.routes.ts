import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { mongoose } from '../config/database';
import { config } from '../config/config';

const router = Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (_req: Request, res: Response) => {
  const health = {
    service: 'ms-guide',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0',
    databases: {
      postgresql: 'unknown',
      cosmosdb: 'unknown',
    },
  };

  try {
    // Check PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`;
    health.databases.postgresql = 'connected';
  } catch (error) {
    health.databases.postgresql = 'disconnected';
    health.status = 'degraded';
  }

  try {
    // Check Cosmos DB MongoDB connection
    if (config.features.useCosmosDB && mongoose.connection.readyState === 1) {
      health.databases.cosmosdb = 'connected';
    } else if (config.features.useCosmosDB) {
      health.databases.cosmosdb = 'disconnected';
      health.status = 'degraded';
    } else {
      health.databases.cosmosdb = 'disabled';
    }
  } catch (error) {
    health.databases.cosmosdb = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * @route GET /health/ready
 * @desc Readiness probe for Kubernetes
 * @access Public
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

/**
 * @route GET /health/live
 * @desc Liveness probe for Kubernetes
 * @access Public
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
