import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

/**
 * @swagger
 * /api/v1/analytics/guides/daily-summary:
 *   get:
 *     summary: Retorna resumo diário de guias
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para consulta (YYYY-MM-DD). Default: hoje
 *     responses:
 *       200:
 *         description: Resumo diário de guias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     finalizadas:
 *                       type: number
 *                     em_andamento:
 *                       type: number
 *                     canceladas:
 *                       type: number
 *                     valor_total:
 *                       type: number
 *                     valor_medio:
 *                       type: number
 */
router.get('/guides/daily-summary', (req, res) => 
  analyticsController.getDailySummary(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/guides/by-status:
 *   get:
 *     summary: Lista guias por status
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FINALIZADA, EM_ANDAMENTO, CANCELADA]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Lista de guias filtradas por status
 */
router.get('/guides/by-status', (req, res) => 
  analyticsController.getGuidesByStatus(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/guides/statistics:
 *   get:
 *     summary: Retorna estatísticas gerais de guias
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estatísticas de guias
 */
router.get('/guides/statistics', (req, res) => 
  analyticsController.getStatistics(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/guides/revenue:
 *   get:
 *     summary: Retorna receita de guias
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Receita de guias
 */
router.get('/guides/revenue', (req, res) => 
  analyticsController.getRevenue(req, res)
);

export default router;
