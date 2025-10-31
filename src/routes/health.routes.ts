import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { mongoose } from '../config/database';
import { config } from '../config/config';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check geral
 *     description: Verifica o status geral do serviço e das conexões com bancos de dados
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serviço saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 databases:
 *                   type: object
 *       503:
 *         description: Serviço degradado
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
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Verifica se o serviço está pronto para receber requisições (usado pelo Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serviço pronto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       503:
 *         description: Serviço não está pronto
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
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Verifica se o serviço está vivo (usado pelo Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serviço vivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
