import { Request, Response } from 'express';
import { GuideService } from '../services/guide.service';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { logger } from '../config/logger';

export class GuideController {
  private guideService: GuideService;

  constructor() {
    this.guideService = new GuideService();
  }

  /**
   * GET /api/v1/guides
   * Lista todas as guias com paginação e filtros
   */
  getAllGuides = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting all guides', { query: req.query });

    const limit = parseInt((req.query.limit as string) || '100', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);
    const page = parseInt((req.query.page as string) || '1', 10);
    const search = req.query.search as string;
    const tipoGuia = req.query.tipoGuia as string;

    const result = await this.guideService.getAllGuides({
      limit,
      offset,
      page,
      search,
      tipoGuia,
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/guides/:id
   * Busca uma guia por ID
   */
  getGuideById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Guide ID is required', 400);
    }

    logger.info('Getting guide by id', { id });
    const guide = await this.guideService.getGuideById(id);

    res.json({
      success: true,
      data: guide,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/guides/:numeroGuiaPrestador/procedures
   * Lista procedimentos de uma guia
   */
  getGuideProcedures = asyncHandler(async (req: Request, res: Response) => {
    const { numeroGuiaPrestador } = req.params;
    if (!numeroGuiaPrestador) {
      throw new AppError('numeroGuiaPrestador is required', 400);
    }

    const limit = parseInt((req.query.limit as string) || '200', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    logger.info('Getting guide procedures', { numeroGuiaPrestador, limit, offset });
    const procedures = await this.guideService.getGuideProcedures(
      numeroGuiaPrestador,
      limit,
      offset
    );

    res.json({
      success: true,
      data: procedures,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/guides/procedures/:procedureId
   * Busca um procedimento específico por ID
   */
  getGuideProcedureById = asyncHandler(async (req: Request, res: Response) => {
    const { procedureId } = req.params;
    if (!procedureId) {
      throw new AppError('Procedure ID is required', 400);
    }

    logger.info('Getting guide procedure by id', { procedureId });
    const procedure = await this.guideService.getGuideProcedureById(procedureId);

    res.json({
      success: true,
      data: procedure,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/guides/stats
   * Retorna estatísticas das guias
   */
  getGuideStats = asyncHandler(async (_req: Request, res: Response) => {
    logger.info('Getting guide statistics');
    const stats = await this.guideService.getGuideStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * PUT /api/v1/guides/procedures/:id/status
   * Atualiza status de um procedimento
   */
  updateProcedureStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, valorAprovado, motivoRejeicao, categoriaRejeicao } = req.body;

    if (!id) {
      throw new AppError('Procedure ID is required', 400);
    }

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    logger.info('Updating procedure status', {
      procedureId: id,
      status,
      valorAprovado,
      hasRejeicao: !!motivoRejeicao,
    });

    const updatedProcedure = await this.guideService.updateProcedureStatus(
      id,
      status,
      valorAprovado,
      motivoRejeicao,
      categoriaRejeicao
    );

    res.json({
      success: true,
      data: updatedProcedure,
      message: 'Procedure status updated successfully',
      timestamp: new Date().toISOString(),
    });
  });
}
