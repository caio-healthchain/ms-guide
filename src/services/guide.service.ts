import { GuideRepository } from '../repositories/guide.repository';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error-handler';
import { PaginatedResponse } from '../types/guide.types';

export class GuideService {
  private guideRepository: GuideRepository;

  constructor() {
    this.guideRepository = new GuideRepository();
  }

  /**
   * Retorna todas as guias com paginação e filtros
   */
  async getAllGuides(params: {
    limit?: number;
    offset?: number;
    page?: number;
    search?: string;
    tipoGuia?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const limit = Math.min(params.limit || 100, 100);
      const page = params.page || 1;
      const offset = params.offset !== undefined ? params.offset : (page - 1) * limit;

      const { data, total } = await this.guideRepository.findAll({
        limit,
        offset,
        search: params.search,
        tipoGuia: params.tipoGuia,
      });

      return {
        data,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      };
    } catch (error) {
      logger.error('Error retrieving guides:', error);
      throw new AppError('Failed to retrieve guides', 500);
    }
  }

  /**
   * Retorna uma guia por ID
   */
  async getGuideById(id: string): Promise<any> {
    try {
      const intId = parseInt(id, 10);
      if (Number.isNaN(intId)) {
        throw new AppError('Invalid guide ID', 400);
      }

      const guide = await this.guideRepository.findById(intId);
      if (!guide) {
        throw new AppError('Guide not found', 404);
      }

      return guide;
    } catch (error) {
      logger.error('Error retrieving guide by id:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide', 500);
    }
  }

  /**
   * Retorna procedimentos de uma guia pelo numeroGuiaPrestador
   */
  async getGuideProcedures(
    numeroGuiaPrestador: string,
    limit = 200,
    offset = 0
  ): Promise<any[]> {
    try {
      const procedures = await this.guideRepository.findProceduresByNumeroGuiaPrestador(
        numeroGuiaPrestador,
        limit,
        offset
      );

      if (!procedures || procedures.length === 0) {
        throw new AppError('Guide not found or has no procedures', 404);
      }

      return procedures;
    } catch (error) {
      logger.error('Error retrieving guide procedures:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide procedures', 500);
    }
  }

  /**
   * Retorna um procedimento específico por ID
   */
  async getGuideProcedureById(id: string): Promise<any> {
    try {
      const intId = parseInt(id, 10);
      if (Number.isNaN(intId)) {
        throw new AppError('Invalid procedure ID', 400);
      }

      const procedure = await this.guideRepository.findProcedureById(intId);
      if (!procedure) {
        throw new AppError('Guide procedure not found', 404);
      }

      return procedure;
    } catch (error) {
      logger.error('Error retrieving guide procedure by id:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide procedure', 500);
    }
  }

  /**
   * Retorna estatísticas das guias
   */
  async getGuideStats(): Promise<any> {
    try {
      const [countByType, totalValue] = await Promise.all([
        this.guideRepository.countByTipoGuia(),
        this.guideRepository.getTotalValue(),
      ]);

      return {
        countByType,
        totalValue,
      };
    } catch (error) {
      logger.error('Error retrieving guide stats:', error);
      throw new AppError('Failed to retrieve guide statistics', 500);
    }
  }
}
