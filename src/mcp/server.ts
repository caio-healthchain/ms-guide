import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

// Instância do serviço de analytics
const analyticsService = new AnalyticsService();

// Definição das tools disponíveis
const TOOLS: Tool[] = [
  {
    name: 'get_daily_guides_summary',
    description: 'Retorna resumo de guias finalizadas no dia. Inclui total, finalizadas, em andamento, canceladas e valores.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Data para consulta no formato YYYY-MM-DD. Se não fornecida, usa a data atual.',
          format: 'date',
        },
      },
    },
  },
  {
    name: 'get_guides_by_status',
    description: 'Lista guias filtradas por status (FINALIZADA, EM_ANDAMENTO, CANCELADA)',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Status das guias',
          enum: ['FINALIZADA', 'EM_ANDAMENTO', 'CANCELADA'],
        },
        date: {
          type: 'string',
          description: 'Data para consulta no formato YYYY-MM-DD',
          format: 'date',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de guias a retornar',
          default: 100,
        },
      },
      required: ['status'],
    },
  },
  {
    name: 'get_guides_statistics',
    description: 'Retorna estatísticas gerais de guias (total, taxa de finalização, valores, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'year'],
          default: 'day',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
      },
    },
  },
  {
    name: 'get_guides_revenue',
    description: 'Retorna receita gerada pelas guias no período especificado',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'year'],
          default: 'day',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
      },
    },
  },
];

/**
 * MCP Server para ms-guide
 * Expõe tools para consulta de dados de guias
 */
class GuidesMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'lazarus-guides-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handler para listar tools disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('[MCP] Listando tools disponíveis');
      return {
        tools: TOOLS,
      };
    });

    // Handler para executar tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`[MCP] Executando tool: ${name}`, { args });

      try {
        switch (name) {
          case 'get_daily_guides_summary':
            return await this.handleGetDailySummary(args);

          case 'get_guides_by_status':
            return await this.handleGetGuidesByStatus(args);

          case 'get_guides_statistics':
            return await this.handleGetStatistics(args);

          case 'get_guides_revenue':
            return await this.handleGetRevenue(args);

          default:
            throw new Error(`Tool desconhecida: ${name}`);
        }
      } catch (error) {
        logger.error(`[MCP] Erro ao executar tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetDailySummary(args: any) {
    const date = args?.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';
    const summary = await analyticsService.getDailySummary(date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async handleGetGuidesByStatus(args: any) {
    if (!args?.status) {
      throw new Error('Parâmetro "status" é obrigatório');
    }

    const date = args.date ? new Date(args.date) : new Date();
    const limit = args.limit || 100;
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const guides = await analyticsService.getGuidesByStatus(args.status, date, limit, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(guides, null, 2),
        },
      ],
    };
  }

  private async handleGetStatistics(args: any) {
    const period = args?.period || 'day';
    const date = args?.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const stats = await analyticsService.getStatistics(period, date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private async handleGetRevenue(args: any) {
    const period = args?.period || 'day';
    const date = args?.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const revenue = await analyticsService.getRevenue(period, date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(revenue, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('[MCP] Servidor MCP iniciado com sucesso');
  }
}

// Iniciar servidor MCP
if (require.main === module) {
  const mcpServer = new GuidesMCPServer();
  mcpServer.run().catch((error) => {
    logger.error('[MCP] Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}

export { GuidesMCPServer };
