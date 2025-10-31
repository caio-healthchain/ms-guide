# Integração do MS-Guide com o Frontend Lazarus

## Visão Geral

O microsserviço `ms-guide` fornece endpoints para consulta de guias TISS e seus procedimentos. Este documento descreve como o frontend `lazarusweb` deve integrar-se com o serviço.

## Endpoints Disponíveis

### Base URL

- **Desenvolvimento**: `http://localhost:3011/api/v1`
- **Produção (via APIM)**: `https://lazarusgateway.azure-api.net/guides`
- **Produção (via Ingress)**: `https://lazarus.healthchainsolutions.com.br/guide/api/v1`

### Autenticação

Todas as requisições (exceto `/health`) requerem autenticação via **API Key**:

```typescript
headers: {
  'X-API-Key': 'your-api-key-here'
}
```

Ou via query parameter:

```
?api_key=your-api-key-here
```

## Endpoints

### 1. Listar Guias

**Endpoint**: `GET /api/v1/guides`

**Descrição**: Lista todas as guias com paginação e filtros

**Query Parameters**:
- `limit` (opcional): Número de itens por página (padrão: 100, máx: 100)
- `offset` (opcional): Número de itens a pular (padrão: 0)
- `page` (opcional): Número da página (padrão: 1)
- `search` (opcional): Busca por número da guia, beneficiário ou carteira
- `tipoGuia` (opcional): Filtro por tipo de guia (ex: "1" para InLoco, "2" para Retrospectiva)

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numeroGuiaPrestador": "12345",
      "numeroCarteira": "67890",
      "tipoGuia": "1",
      "diagnostico": "CID Z00.0",
      "valorTotalProcedimentos": 1500.00,
      "valorTotalGeral": 1500.00,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "procedimentos": [
        {
          "id": 1,
          "sequencialItem": "1",
          "codigoProcedimento": "40101010",
          "descricaoProcedimento": "Consulta médica",
          "valorTotal": 150.00
        }
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 100,
  "hasNext": false,
  "hasPrev": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Buscar Guia por ID

**Endpoint**: `GET /api/v1/guides/:id`

**Descrição**: Busca uma guia específica por ID

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numeroGuiaPrestador": "12345",
    "numeroCarteira": "67890",
    "tipoGuia": "1",
    "diagnostico": "CID Z00.0",
    "valorTotalProcedimentos": 1500.00,
    "procedimentos": [...]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Listar Procedimentos de uma Guia

**Endpoint**: `GET /api/v1/guides/:numeroGuiaPrestador/procedures`

**Descrição**: Lista todos os procedimentos de uma guia específica

**Query Parameters**:
- `limit` (opcional): Número de itens por página (padrão: 200)
- `offset` (opcional): Número de itens a pular (padrão: 0)

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sequencialItem": "1",
      "codigoProcedimento": "40101010",
      "descricaoProcedimento": "Consulta médica",
      "quantidadeExecutada": 1,
      "valorUnitario": 150.00,
      "valorTotal": 150.00,
      "dataExecucao": "2024-01-15",
      "guiaId": 1
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. Buscar Procedimento por ID

**Endpoint**: `GET /api/v1/guides/procedures/:procedureId`

**Descrição**: Busca um procedimento específico por ID

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sequencialItem": "1",
    "codigoProcedimento": "40101010",
    "descricaoProcedimento": "Consulta médica",
    "quantidadeExecutada": 1,
    "valorUnitario": 150.00,
    "valorTotal": 150.00,
    "guia": {
      "numeroGuiaPrestador": "12345",
      "numeroCarteira": "67890",
      "tipoGuia": "1"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 5. Estatísticas de Guias

**Endpoint**: `GET /api/v1/guides/stats`

**Descrição**: Retorna estatísticas agregadas das guias

**Resposta**:
```json
{
  "success": true,
  "data": {
    "countByType": {
      "1": 25,
      "2": 30
    },
    "totalValue": 75000.00
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Integração com o Frontend

### Atualização do `config/auth.ts`

Os endpoints já estão configurados:

```typescript
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  endpoints: {
    guias: '/api/v1/guides',
    guiaProcedimentos: '/api/v1/guides/procedures',
  }
};
```

### Atualização do `services/api.ts`

O serviço `guideService` já está implementado e deve funcionar corretamente com o ms-guide:

```typescript
export const guideService = {
  getAll: (params?: { page?: number; limit?: number; search?: string; tipoGuia?: string }) =>
    apiClient.get<PaginatedResponse<Guide>>(API_CONFIG.endpoints.guias, { params }),

  getProcedures: (numeroGuiaPrestador: string) =>
    apiClient.get<ApiResponse<GuiaProcedure[]>>(
      `${API_CONFIG.endpoints.guias}/${numeroGuiaPrestador}/procedures`
    ),

  getProcedureById: (procedureId: string) =>
    apiClient.get<ApiResponse<GuiaProcedure>>(
      `${API_CONFIG.endpoints.guiaProcedimentos}/${procedureId}`
    ),
};
```

### Funcionalidades da Tela `Audits.tsx`

A tela de auditorias já está preparada para:

1. **Listar guias com paginação**
2. **Filtrar por tipo de guia** (Todas, InLoco, Retrospectiva)
3. **Buscar por número da guia, beneficiário ou carteira**
4. **Exibir cards com totais**:
   - Total de Guias
   - Valor Total
   - Status de Sincronização

### Mapeamento de Tipo de Guia

O frontend usa a função `getAuditSessionName()` para mapear o tipo de guia:

```typescript
// Exemplo de mapeamento
tipoGuia: "1" → "InLoco"
tipoGuia: "2" → "Retrospectiva"
```

### Cálculo de Totais

O frontend calcula os totais a partir dos dados retornados:

```typescript
const totalGuias = guiasResponse?.total ?? guias.length;
const totalProcedimentos = useMemo(() => {
  return guias.reduce((acc, g) => 
    acc + (g.valorTotalProcedimentos ? Number(g.valorTotalProcedimentos) : 0), 0
  );
}, [guias]);
```

### Filtros por Tipo de Guia

O frontend filtra as guias por tipo usando a função `getAuditSessionName()`:

```typescript
const filteredBase = guias.filter((g) => {
  const session = getAuditSessionName(g.tipoGuia).toLowerCase();
  if (view === 'all') return true;
  if (view === 'inloco') return session === 'inloco';
  return session === 'retrospectiva';
});
```

## Variáveis de Ambiente

Configure no frontend (`.env`):

```env
VITE_API_BASE_URL=http://localhost:3011
VITE_API_KEY=your-api-key-here
```

Ou para produção:

```env
VITE_API_BASE_URL=https://lazarusgateway.azure-api.net
VITE_API_KEY=production-api-key
```

## Tratamento de Erros

O ms-guide retorna erros padronizados:

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Códigos de status HTTP:
- `200`: Sucesso
- `400`: Requisição inválida
- `401`: API Key não fornecida
- `403`: API Key inválida
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

## Próximos Passos

1. ✅ Endpoints implementados e testados
2. ✅ Autenticação via API Key configurada
3. ✅ Paginação e filtros funcionando
4. ⏳ Testar integração com frontend em ambiente de desenvolvimento
5. ⏳ Deploy no Azure Kubernetes Service (AKS)
6. ⏳ Configurar APIM para roteamento
7. ⏳ Validar em produção

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação da API: `http://localhost:3011/api-docs`
- Health check: `http://localhost:3011/health`
- Logs do serviço: `kubectl logs -l app=ms-guide -f`
