import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class GuideRepository {
  /**
   * Retorna todas as guias com paginação e filtros
   */
  async findAll(params: {
    limit?: number;
    offset?: number;
    search?: string;
    tipoGuia?: string;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const { limit = 100, offset = 0, search, tipoGuia } = params;

      const where: any = {};

      // Filtro por tipo de guia
      if (tipoGuia) {
        where.tipoGuia = tipoGuia;
      }

      // Busca por número da guia, beneficiário ou carteira
      if (search) {
        where.OR = [
          { numeroGuiaPrestador: { contains: search, mode: 'insensitive' } },
          { numeroCarteira: { contains: search, mode: 'insensitive' } },
          { numeroGuiaOperadora: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [guides, total] = await Promise.all([
        prisma.guia.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            procedimentos: {
              select: {
                id: true,
                sequencialItem: true,
                codigoProcedimento: true,
                descricaoProcedimento: true,
                valorTotal: true,
              },
            },
          },
        }),
        prisma.guia.count({ where }),
      ]);

      return { data: guides, total };
    } catch (error) {
      logger.error('Failed to fetch guides from DB:', error);
      throw error;
    }
  }

  /**
   * Retorna uma guia por ID
   */
  async findById(id: number): Promise<any | null> {
    try {
      const guide = await prisma.guia.findUnique({
        where: { id },
        include: {
          procedimentos: true,
        },
      });

      return guide || null;
    } catch (error) {
      logger.error('Failed to fetch guide by id:', error);
      throw error;
    }
  }

  /**
   * Busca guia pelo numeroGuiaPrestador
   */
  async findByNumeroGuiaPrestador(numeroGuiaPrestador: string): Promise<any | null> {
    try {
      const guide = await prisma.guia.findUnique({
        where: { numeroGuiaPrestador },
        include: {
          procedimentos: true,
        },
      });

      return guide || null;
    } catch (error) {
      logger.error('Failed to fetch guide by numeroGuiaPrestador:', error);
      throw error;
    }
  }

  /**
   * Lista procedimentos de uma guia usando numeroGuiaPrestador
   */
  async findProceduresByNumeroGuiaPrestador(
    numeroGuiaPrestador: string,
    limit = 200,
    offset = 0
  ): Promise<any[]> {
    try {
      // Primeiro busca a guia
      const guide = await this.findByNumeroGuiaPrestador(numeroGuiaPrestador);

      if (!guide) {
        return [];
      }

      // Busca os procedimentos
      const procedures = await prisma.procedimento.findMany({
        where: { guiaId: guide.id },
        take: limit,
        skip: offset,
        orderBy: [{ sequencialItem: 'asc' }, { id: 'asc' }],
      });

      return procedures || [];
    } catch (error) {
      logger.error('Failed to fetch guide procedures by numeroGuiaPrestador:', error);
      throw error;
    }
  }

  /**
   * Retorna um procedimento específico por ID
   */
  async findProcedureById(id: number): Promise<any | null> {
    try {
      const procedure = await prisma.procedimento.findUnique({
        where: { id },
        include: {
          guia: {
            select: {
              numeroGuiaPrestador: true,
              numeroCarteira: true,
              tipoGuia: true,
            },
          },
        },
      });

      return procedure || null;
    } catch (error) {
      logger.error('Failed to fetch guide procedure by id:', error);
      throw error;
    }
  }

  /**
   * Conta guias por tipo
   */
  async countByTipoGuia(): Promise<{ [key: string]: number }> {
    try {
      const result = await prisma.guia.groupBy({
        by: ['tipoGuia'],
        _count: true,
      });

      const counts: { [key: string]: number } = {};
      result.forEach((item) => {
        if (item.tipoGuia) {
          counts[item.tipoGuia] = item._count;
        }
      });

      return counts;
    } catch (error) {
      logger.error('Failed to count guides by tipoGuia:', error);
      throw error;
    }
  }

  /**
   * Calcula valor total de todas as guias
   */
  async getTotalValue(): Promise<number> {
    try {
      const result = await prisma.guia.aggregate({
        _sum: {
          valorTotalProcedimentos: true,
        },
      });

      return result._sum.valorTotalProcedimentos || 0;
    } catch (error) {
      logger.error('Failed to calculate total value:', error);
      throw error;
    }
  }
}
