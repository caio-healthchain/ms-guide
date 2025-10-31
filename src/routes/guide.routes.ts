import { Router } from 'express';
import { GuideController } from '../controllers/guide.controller';
import { apiKeyMiddleware } from '../middleware/api-key';

const router = Router();
const controller = new GuideController();

/**
 * @route GET /api/v1/guides
 * @desc List guides with pagination and filters
 * @query limit - Number of items per page (default: 100, max: 100)
 * @query offset - Number of items to skip (default: 0)
 * @query page - Page number (default: 1)
 * @query search - Search by numeroGuiaPrestador, numeroCarteira, or numeroGuiaOperadora
 * @query tipoGuia - Filter by guide type
 * @access API Key required
 */
router.get('/', apiKeyMiddleware, controller.getAllGuides);

/**
 * @route GET /api/v1/guides/stats
 * @desc Get guide statistics
 * @access API Key required
 */
router.get('/stats', apiKeyMiddleware, controller.getGuideStats);

/**
 * @route GET /api/v1/guides/procedures/:procedureId
 * @desc Get a single guide procedure by id
 * @access API Key required
 */
router.get('/procedures/:procedureId', apiKeyMiddleware, controller.getGuideProcedureById);

/**
 * @route GET /api/v1/guides/:numeroGuiaPrestador/procedures
 * @desc List procedures for a guide by numeroGuiaPrestador
 * @access API Key required
 */
router.get('/:numeroGuiaPrestador/procedures', apiKeyMiddleware, controller.getGuideProcedures);

/**
 * @route GET /api/v1/guides/:id
 * @desc Get a single guide by id
 * @access API Key required
 */
router.get('/:id', apiKeyMiddleware, controller.getGuideById);

export default router;
