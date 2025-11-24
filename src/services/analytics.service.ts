import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface DailySummary {
  total: number;
  finalizadas: number;
  em_andamento: number;
  canceladas: number;
  valor_total: number;
  valor_medio: number;
}

export interface GuideInfo {
  id: number;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora: string | null;
  numeroCarteira: string | null;
  dataAutorizacao: Date | null;
  valorTotalGeral: number | null;
  tipoFaturamento: string | null;
  status: string;
}

export interface Statistics {
  total_guias: number;
  guias_finalizadas: number;
  guias_em_andamento: number;
  guias_canceladas: number;
  taxa_finalizacao: number;
  valor_total: number;
  valor_medio_guia: number;
  procedimentos_total: number;
  procedimentos_por_guia: number;
}

export interface Revenue {
  receita_total: number;
  guias_faturadas: number;
  valor_medio_guia: number;
  valor_total_procedimentos: number;
  valor_total_materiais: number;
  valor_total_medicamentos: number;
  por_tipo_faturamento: Array<{
    tipo: string;
    quantidade: number;
    valor_total: number;
  }>;
}

export class AnalyticsService {
  /**
   * Retorna resumo diário de guias
   */
  async getDailySummary(date: Date): Promise<DailySummary> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Total de guias do dia
      const total = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Guias finalizadas (com data de finalização)
      const finalizadas = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          dataFinalFaturamento: {
            not: null
          }
        }
      });

      // Guias em andamento (sem data de finalização)
      const em_andamento = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          dataFinalFaturamento: null,
          motivoEncerramento: null
        }
      });

      // Guias canceladas (com motivo de encerramento)
      const canceladas = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          motivoEncerramento: {
            not: null
          }
        }
      });

      // Valor total das guias do dia
      const valorAggregate = await prisma.guia.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        _sum: {
          valorTotalGeral: true
        }
      });

      const valor_total = valorAggregate._sum.valorTotalGeral || 0;
      const valor_medio = total > 0 ? valor_total / total : 0;

      logger.info(`[Analytics] Resumo diário: ${total} guias, ${finalizadas} finalizadas`);

      return {
        total,
        finalizadas,
        em_andamento,
        canceladas,
        valor_total: Number(valor_total),
        valor_medio: Number(valor_medio)
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar resumo diário:', error);
      throw error;
    }
  }

  /**
   * Lista guias por status
   */
  async getGuidesByStatus(status: string, date: Date, limit: number): Promise<GuideInfo[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let whereClause: any = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      };

      // Filtro por status
      switch (status.toUpperCase()) {
        case 'FINALIZADA':
          whereClause.dataFinalFaturamento = { not: null };
          break;
        case 'EM_ANDAMENTO':
          whereClause.dataFinalFaturamento = null;
          whereClause.motivoEncerramento = null;
          break;
        case 'CANCELADA':
          whereClause.motivoEncerramento = { not: null };
          break;
        default:
          throw new Error(`Status inválido: ${status}`);
      }

      const guides = await prisma.guia.findMany({
        where: whereClause,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          numeroGuiaPrestador: true,
          numeroGuiaOperadora: true,
          numeroCarteira: true,
          dataAutorizacao: true,
          valorTotalGeral: true,
          tipoFaturamento: true
        }
      });

      return guides.map(guide => ({
        ...guide,
        status: status.toUpperCase()
      }));
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar guias por status:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas gerais
   */
  async getStatistics(period: string, date: Date): Promise<Statistics> {
    try {
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const total_guias = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const guias_finalizadas = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          dataFinalFaturamento: { not: null }
        }
      });

      const guias_em_andamento = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          dataFinalFaturamento: null,
          motivoEncerramento: null
        }
      });

      const guias_canceladas = await prisma.guia.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          motivoEncerramento: { not: null }
        }
      });

      const valorAggregate = await prisma.guia.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          valorTotalGeral: true
        }
      });

      const procedimentosCount = await prisma.guia_procedimentos.count({
        where: {
          guia: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      });

      const valor_total = Number(valorAggregate._sum.valorTotalGeral || 0);
      const taxa_finalizacao = total_guias > 0 ? (guias_finalizadas / total_guias) * 100 : 0;
      const valor_medio_guia = total_guias > 0 ? valor_total / total_guias : 0;
      const procedimentos_por_guia = total_guias > 0 ? procedimentosCount / total_guias : 0;

      return {
        total_guias,
        guias_finalizadas,
        guias_em_andamento,
        guias_canceladas,
        taxa_finalizacao: Number(taxa_finalizacao.toFixed(2)),
        valor_total,
        valor_medio_guia: Number(valor_medio_guia.toFixed(2)),
        procedimentos_total: procedimentosCount,
        procedimentos_por_guia: Number(procedimentos_por_guia.toFixed(2))
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Retorna receita do período
   */
  async getRevenue(period: string, date: Date): Promise<Revenue> {
    try {
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const guias = await prisma.guia.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          dataFinalFaturamento: { not: null }
        },
        select: {
          valorTotalGeral: true,
          valorTotalProcedimentos: true,
          valorTotalMateriais: true,
          valorTotalMedicamentos: true,
          tipoFaturamento: true
        }
      });

      const receita_total = guias.reduce((sum, g) => sum + (g.valorTotalGeral || 0), 0);
      const valor_total_procedimentos = guias.reduce((sum, g) => sum + (g.valorTotalProcedimentos || 0), 0);
      const valor_total_materiais = guias.reduce((sum, g) => sum + (g.valorTotalMateriais || 0), 0);
      const valor_total_medicamentos = guias.reduce((sum, g) => sum + (g.valorTotalMedicamentos || 0), 0);
      const valor_medio_guia = guias.length > 0 ? receita_total / guias.length : 0;

      // Agrupa por tipo de faturamento
      const porTipo = guias.reduce((acc: any, guia) => {
        const tipo = guia.tipoFaturamento || 'NAO_ESPECIFICADO';
        if (!acc[tipo]) {
          acc[tipo] = { tipo, quantidade: 0, valor_total: 0 };
        }
        acc[tipo].quantidade++;
        acc[tipo].valor_total += guia.valorTotalGeral || 0;
        return acc;
      }, {});

      return {
        receita_total: Number(receita_total),
        guias_faturadas: guias.length,
        valor_medio_guia: Number(valor_medio_guia.toFixed(2)),
        valor_total_procedimentos: Number(valor_total_procedimentos),
        valor_total_materiais: Number(valor_total_materiais),
        valor_total_medicamentos: Number(valor_total_medicamentos),
        por_tipo_faturamento: Object.values(porTipo)
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar receita:', error);
      throw error;
    }
  }

  /**
   * Helper para calcular datas do período
   */
  private getPeriodDates(period: string, date: Date): { startDate: Date; endDate: Date } {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'day':
        // Já configurado
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        throw new Error(`Período inválido: ${period}`);
    }

    return { startDate, endDate };
  }
}
