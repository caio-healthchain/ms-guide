import { Router } from 'express';
import { GuideController } from '../controllers/guide.controller';
import { apiKeyMiddleware } from '../middleware/api-key';

const router = Router();
const controller = new GuideController();

/**
 * @swagger
 * /api/v1/guides:
 *   get:
 *     summary: Lista todas as guias
 *     description: Retorna uma lista paginada de guias com suporte a filtros e busca
 *     tags: [Guides]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 100
 *         description: Número de itens por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de itens a pular
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número da guia, carteira ou operadora
 *       - in: query
 *         name: tipoGuia
 *         schema:
 *           type: string
 *         description: Filtro por tipo de guia (1=InLoco, 2=Retrospectiva)
 *     responses:
 *       200:
 *         description: Lista de guias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 hasNext:
 *                   type: boolean
 *                 hasPrev:
 *                   type: boolean
 *       401:
 *         description: API Key não fornecida
 *       403:
 *         description: API Key inválida
 */
router.get('/', apiKeyMiddleware, controller.getAllGuides);

/**
 * @swagger
 * /api/v1/guides/stats:
 *   get:
 *     summary: Retorna estatísticas das guias
 *     description: Retorna contagem por tipo e valor total das guias
 *     tags: [Guides]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
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
 *                     countByType:
 *                       type: object
 *                     totalValue:
 *                       type: number
 *       401:
 *         description: API Key não fornecida
 */
router.get('/stats', apiKeyMiddleware, controller.getGuideStats);

/**
 * @swagger
 * /api/v1/guides/procedures/{procedureId}:
 *   get:
 *     summary: Busca um procedimento por ID
 *     description: Retorna os detalhes de um procedimento específico
 *     tags: [Guides]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do procedimento
 *     responses:
 *       200:
 *         description: Procedimento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Procedimento não encontrado
 *       401:
 *         description: API Key não fornecida
 */
router.get('/procedures/:procedureId', apiKeyMiddleware, controller.getGuideProcedureById);

/**
 * @swagger
 * /api/v1/guides/{numeroGuiaPrestador}/procedures:
 *   get:
 *     summary: Lista procedimentos de uma guia
 *     description: Retorna todos os procedimentos de uma guia específica pelo número da guia do prestador
 *     tags: [Guides]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: numeroGuiaPrestador
 *         required: true
 *         schema:
 *           type: string
 *         description: Número da guia do prestador
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *         description: Número de itens por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de itens a pular
 *     responses:
 *       200:
 *         description: Lista de procedimentos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Guia não encontrada
 *       401:
 *         description: API Key não fornecida
 */
router.get('/:numeroGuiaPrestador/procedures', apiKeyMiddleware, controller.getGuideProcedures);

/**
 * @swagger
 * /api/v1/guides/{id}:
 *   get:
 *     summary: Busca uma guia por ID
 *     description: Retorna os detalhes completos de uma guia específica
 *     tags: [Guides]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da guia
 *     responses:
 *       200:
 *         description: Guia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Guia não encontrada
 *       401:
 *         description: API Key não fornecida
 */
router.get('/:id', apiKeyMiddleware, controller.getGuideById);

export default router;
