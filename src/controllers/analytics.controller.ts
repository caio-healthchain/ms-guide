import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * GET /api/v1/analytics/guides/daily-summary
   * Retorna resumo de guias do dia
   */
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando resumo diário de guias para ${targetDate.toISOString()}`);

      const summary = await this.analyticsService.getDailySummary(targetDate);

      res.json({
        success: true,
        data: summary,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar resumo diário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar resumo diário de guias'
      });
    }
  }

  /**
   * GET /api/v1/analytics/guides/by-status
   * Lista guias por status
   */
  async getGuidesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status, date, limit = '100' } = req.query;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Parâmetro "status" é obrigatório'
        });
        return;
      }

      const targetDate = date ? new Date(date as string) : new Date();
      const limitNum = parseInt(limit as string, 10);

      logger.info(`[Analytics] Buscando guias com status ${status} para ${targetDate.toISOString()}`);

      const guides = await this.analyticsService.getGuidesByStatus(
        status as string,
        targetDate,
        limitNum
      );

      res.json({
        success: true,
        data: guides,
        count: guides.length,
        status,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar guias por status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar guias por status'
      });
    }
  }

  /**
   * GET /api/v1/analytics/guides/statistics
   * Retorna estatísticas gerais de guias
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'day', date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando estatísticas de guias (período: ${period})`);

      const stats = await this.analyticsService.getStatistics(
        period as string,
        targetDate
      );

      res.json({
        success: true,
        data: stats,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas de guias'
      });
    }
  }

  /**
   * GET /api/v1/analytics/guides/revenue
   * Retorna receita de guias
   */
  async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'day', date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando receita de guias (período: ${period})`);

      const revenue = await this.analyticsService.getRevenue(
        period as string,
        targetDate
      );

      res.json({
        success: true,
        data: revenue,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar receita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar receita de guias'
      });
    }
  }
}
