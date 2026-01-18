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
    hospitalId?: string;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const { limit = 100, offset = 0, search, tipoGuia, hospitalId = 'hosp_sagrada_familia_001' } = params;

      const where: any = { hospitalId };

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
            guia_procedimentos: {
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

      // Calcular auditStatus para cada guia baseado nos procedimentos
      const guidesWithStatus = await Promise.all(
        guides.map(async (guide) => {
          // Buscar status dos procedimentos
          const procedimentosStatus = await prisma.procedimento_status.findMany({
            where: { guiaId: guide.id },
            select: { status: true, procedimentoId: true },
          });

          // Criar mapa de status por procedimentoId
          const statusMap = new Map(
            procedimentosStatus.map(ps => [ps.procedimentoId, ps.status])
          );

          // Verificar se todos os procedimentos têm status definido e nenhum está PENDENTE
          const totalProcedimentos = guide.guia_procedimentos.length;
          const procedimentosComStatus = guide.guia_procedimentos.filter(p => 
            statusMap.has(p.id)
          ).length;
          
          const hasPendente = guide.guia_procedimentos.some(p => {
            const status = statusMap.get(p.id);
            return !status || status === 'PENDENTE';
          });

          // Determinar auditStatus
          let auditStatus = 'PENDING';
          if (totalProcedimentos > 0 && procedimentosComStatus === totalProcedimentos && !hasPendente) {
            auditStatus = 'COMPLETED';
          }

          return {
            ...guide,
            auditStatus,
          };
        })
      );

      return { data: guidesWithStatus, total };
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
          guia_procedimentos: true,
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
          guia_procedimentos: true,
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
      // Mapear status de português para inglês para compatibilidade com frontend
      const statusMap: Record<string, string> = {
        'APROVADO': 'APPROVED',
        'REJEITADO': 'REJECTED',
        'PENDENTE': 'PENDING'
      };
      
      const proceduresWithStatus = (procedures as any[]).map(proc => ({
        ...proc,
        guiaId: String(proc.guiaId),
        status: statusMap[proc.auditStatus] || 'PENDING',
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
      const procedure = await prisma.guia_procedimentos.findUnique({
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
  async countByTipoGuia(hospitalId: string = 'hosp_sagrada_familia_001'): Promise<{ [key: string]: number }> {
    try {
      const result = await prisma.guia.groupBy({
        by: ['tipoGuia'],
        where: { hospitalId },
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
  async getTotalValue(hospitalId: string = 'hosp_sagrada_familia_001'): Promise<number> {
    try {
      const result = await prisma.guia.aggregate({
        where: { hospitalId },
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

  /**
   * Atualiza status e campos relacionados de um procedimento
   */
  async updateProcedureStatus(
    id: number,
    updateData: {
      status?: string;
      valorAprovado?: number;
      motivoRejeicao?: string;
      categoriaRejeicao?: string;
    }
  ): Promise<any | null> {
    try {
      // Atualizar campos valorAprovado, motivoRejeicao, categoriaRejeicao na tabela procedimento
      const procedimentoData: any = {};
      if (updateData.valorAprovado !== undefined) {
        procedimentoData.valorAprovado = updateData.valorAprovado;
      }
      if (updateData.motivoRejeicao !== undefined) {
        procedimentoData.motivoRejeicao = updateData.motivoRejeicao;
      }
      if (updateData.categoriaRejeicao !== undefined) {
        procedimentoData.categoriaRejeicao = updateData.categoriaRejeicao;
      }

      // Buscar procedimento para obter guiaId
      const procedimento = await prisma.guia_procedimentos.findUnique({
        where: { id },
        select: { guiaId: true },
      });

      if (!procedimento) {
        throw new Error(`Procedimento ${id} não encontrado`);
      }

      // Atualizar procedimento com novos campos
      const updatedProcedure = await prisma.guia_procedimentos.update({
        where: { id },
        data: procedimentoData,
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

      // Atualizar ou criar status na tabela procedimento_status
      if (updateData.status) {
        // Converter status de inglês para português (banco usa enum em PT)
        const statusMap: Record<string, string> = {
          'APPROVED': 'APROVADO',
          'REJECTED': 'REJEITADO',
          'PENDING': 'PENDENTE'
        };
        const statusPT = statusMap[updateData.status] || updateData.status;

        await prisma.procedimento_status.upsert({
          where: {
            guiaId_procedimentoId: {
              guiaId: procedimento.guiaId,
              procedimentoId: id,
            },
          },
          update: {
            status: statusPT as any,
            updatedAt: new Date(),
          },
          create: {
            procedimentoId: id,
            guiaId: procedimento.guiaId,
            status: statusPT as any,
            auditorId: 'SYSTEM', // Auditor padrão para aprovações automáticas
          },
        });
      }

      return updatedProcedure;
    } catch (error) {
      logger.error('Failed to update procedure status:', error);
      throw error;
    }
  }
}
