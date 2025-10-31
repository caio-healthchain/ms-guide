# MS-Guide - Microsserviço de Gerenciamento de Guias TISS

Microsserviço responsável pelo gerenciamento de guias TISS (Troca de Informações em Saúde Suplementar) importadas via XML, incluindo consulta de guias e seus procedimentos.

## Tecnologias

- **Node.js** 18+
- **TypeScript** 5.x
- **Express** 4.x
- **Prisma ORM** 5.x
- **PostgreSQL** (Write Database)
- **Cosmos DB MongoDB** (Read Database - CQRS)
- **Azure Service Bus** (Event Bus)

## Arquitetura

Este microsserviço segue o padrão **CQRS (Command Query Responsibility Segregation)**:

- **Write**: PostgreSQL (comandos de escrita)
- **Read**: Cosmos DB MongoDB (consultas otimizadas)

## Estrutura do Projeto

```
ms-guide/
├── src/
│   ├── config/          # Configurações (database, logger, eventbus)
│   ├── controllers/     # Controllers HTTP
│   ├── middleware/      # Middlewares (auth, error-handler, logger)
│   ├── models/          # Modelos de dados
│   ├── repositories/    # Camada de acesso a dados
│   ├── routes/          # Definição de rotas
│   ├── services/        # Lógica de negócio
│   ├── types/           # Tipos TypeScript
│   ├── validators/      # Validadores de entrada
│   └── index.ts         # Entry point
├── prisma/
│   └── schema.prisma    # Schema do banco de dados
└── package.json
```

## Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações (se necessário)
npm run prisma:migrate
```

## Configuração

Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:

```bash
cp .env.example .env
```

## Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Endpoints

### Guias

- `GET /api/v1/guides` - Listar todas as guias (com paginação)
- `GET /api/v1/guides/:id` - Buscar guia por ID
- `GET /api/v1/guides/:numeroGuiaPrestador/procedures` - Listar procedimentos de uma guia

### Procedimentos

- `GET /api/v1/guides/procedures/:procedureId` - Buscar procedimento por ID

### Health Check

- `GET /health` - Verificar status do serviço

## Autenticação

Todas as rotas (exceto `/health`) requerem autenticação via **API Key**:

- Header: `X-API-Key: your-api-key`
- Query param: `?api_key=your-api-key`

## Documentação API

Acesse a documentação Swagger em: `http://localhost:3011/api-docs`

## Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## Deploy

O serviço está configurado para deploy no **Azure Kubernetes Service (AKS)**.

Arquivos de configuração:
- `deployment.yaml` - Deployment do Kubernetes
- `service.yaml` - Service do Kubernetes
- `ingress.yaml` - Ingress do Kubernetes

## Licença

Proprietary - HealthChain Solutions
