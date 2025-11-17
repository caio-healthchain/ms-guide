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

      // Busca os procedimentos com status usando raw SQL para evitar problemas de cache do Prisma
      const procedures = await prisma.$queryRaw`
        SELECT 
          p.*,
          ps.status as "auditStatus",
          ps."auditorId" as "statusAuditorId",
          ps.observacoes as "statusObservacoes",
          ps."updatedAt" as "statusUpdatedAt"
        FROM guia_procedimentos p
        LEFT JOIN procedimento_status ps ON p.id = ps."procedimentoId"
        WHERE p."guiaId" = ${guide.id}
        ORDER BY p."sequencialItem" ASC, p.id ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Mapear para incluir o status no nível raiz do objeto
      const proceduresWithStatus = (procedures as any[]).map(proc => ({
        ...proc,
        guiaId: String(proc.guiaId),
        status: proc.auditStatus || 'PENDING',
        auditorId: proc.statusAuditorId,
        observacoes: proc.statusObservacoes,
        statusUpdatedAt: proc.statusUpdatedAt,
      }));

      return proceduresWithStatus || [];
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
