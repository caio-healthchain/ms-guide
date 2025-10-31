# Guia de Deploy - MS-Guide

## ✅ O que foi entregue

### 1. Microsserviço Completo
- ✅ Endpoints REST API para gerenciamento de guias TISS
- ✅ Autenticação via API Key
- ✅ Integração com PostgreSQL (write) e Cosmos DB MongoDB (read) - CQRS
- ✅ Paginação, filtros e busca
- ✅ Logging estruturado com Winston
- ✅ Health checks para Kubernetes
- ✅ Rate limiting e segurança
- ✅ Documentação Swagger/OpenAPI

### 2. Configurações de Infraestrutura
- ✅ Dockerfile otimizado multi-stage
- ✅ Deployment Kubernetes (AKS)
- ✅ Service ClusterIP
- ✅ Ingress NGINX
- ✅ Secrets do Kubernetes (template)
- ✅ Configuração APIM (Azure API Management)

### 3. Documentação
- ✅ README completo
- ✅ Guia de integração com frontend
- ✅ Documentação de API
- ✅ Este guia de deploy

### 4. Repositório Git
- ✅ Código commitado em: https://github.com/caio-healthchain/ms-guide
- ✅ Histórico limpo sem credenciais

---

## 🚀 Próximos Passos para Deploy

### Passo 1: Criar Secrets no Kubernetes

Antes de fazer o deploy, você precisa criar os secrets no cluster AKS:

```bash
# Conectar ao cluster AKS
az aks get-credentials --resource-group lazarus-rg --name lazarus-aks

# Criar o secret com as credenciais
kubectl create secret generic lazarus-secrets \
  --from-literal=api-key='sua-api-key-aqui' \
  --from-literal=database-url='postgresql://username:password@host:5432/database?sslmode=require' \
  --from-literal=cosmosdb-uri='mongodb+srv://username:password@host/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000' \
  --from-literal=service-bus-connection-string='Endpoint=sb://your-servicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key-here'

# Verificar se o secret foi criado
kubectl get secret lazarus-secrets
```

### Passo 2: Build e Push da Imagem Docker

```bash
# Clonar o repositório (se ainda não tiver)
git clone https://github.com/caio-healthchain/ms-guide.git
cd ms-guide

# Fazer login no Azure Container Registry
az acr login --name lazarusacr

# Build da imagem
docker build -t lazarusacr.azurecr.io/ms-guide:latest .

# Push para o ACR
docker push lazarusacr.azurecr.io/ms-guide:latest
```

**Ou use o script automatizado:**

```bash
chmod +x scripts/build-and-deploy.sh
./scripts/build-and-deploy.sh latest
```

### Passo 3: Deploy no Kubernetes

```bash
# Aplicar as configurações
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/services-clusterip-updated.yaml
kubectl apply -f k8s/ingress-nginx-updated.yaml

# Verificar o status do deployment
kubectl rollout status deployment/ms-guide

# Verificar os pods
kubectl get pods -l app=ms-guide

# Verificar os logs
kubectl logs -l app=ms-guide -f
```

### Passo 4: Testar o Serviço

```bash
# Obter o IP do Ingress
kubectl get ingress microservices-ingress

# Testar health check (sem autenticação)
curl http://<INGRESS_IP>/guide/health

# Testar endpoint de guias (com API Key)
curl -H "X-API-Key: sua-api-key" http://<INGRESS_IP>/guide/api/v1/guides

# Ou via APIM (se configurado)
curl -H "X-API-Key: sua-api-key" https://lazarusgateway.azure-api.net/guides
```

### Passo 5: Configurar APIM (Opcional)

1. Acesse o Azure Portal
2. Navegue até o Azure API Management
3. Importe a configuração do arquivo `apim/api-config.xml`
4. Configure as políticas de segurança e rate limiting
5. Teste os endpoints via APIM

---

## 🔧 Configuração do Frontend

### Atualizar variáveis de ambiente

No frontend `lazarusweb`, configure o arquivo `.env`:

```env
# Desenvolvimento (local)
VITE_API_BASE_URL=http://localhost:3011
VITE_API_KEY=sua-api-key-dev

# Produção (via Ingress)
VITE_API_BASE_URL=https://lazarus.healthchainsolutions.com.br/guide
VITE_API_KEY=sua-api-key-prod

# Produção (via APIM)
VITE_API_BASE_URL=https://lazarusgateway.azure-api.net
VITE_API_KEY=sua-api-key-prod
```

### Endpoints já configurados

Os endpoints já estão configurados no `config/auth.ts`:

```typescript
guias: '/api/v1/guides',
guiaProcedimentos: '/api/v1/guides/procedures',
```

### Funcionalidades da Tela Audits.tsx

A tela já está preparada para:
- ✅ Listar guias com paginação
- ✅ Filtrar por tipo (Todas, InLoco, Retrospectiva)
- ✅ Buscar por número da guia, beneficiário ou carteira
- ✅ Exibir cards com totais (Total de Guias, Valor Total)
- ✅ Exibir procedimentos de cada guia

---

## 📊 Monitoramento e Logs

### Verificar logs do serviço

```bash
# Logs em tempo real
kubectl logs -l app=ms-guide -f

# Logs de um pod específico
kubectl logs <pod-name>

# Logs dos últimos 100 linhas
kubectl logs -l app=ms-guide --tail=100
```

### Health Checks

O serviço expõe 3 endpoints de health check:

- `GET /health` - Status geral do serviço
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /health/live` - Liveness probe (Kubernetes)

### Métricas

Para monitoramento avançado, considere integrar:
- Azure Application Insights
- Prometheus + Grafana
- Azure Monitor

---

## 🔒 Segurança

### API Key

A API Key deve ser:
- ✅ Armazenada no Kubernetes Secret
- ✅ Rotacionada periodicamente
- ✅ Diferente para cada ambiente (dev, staging, prod)

### Credenciais de Banco de Dados

- ✅ Armazenadas no Kubernetes Secret
- ✅ Nunca commitadas no Git
- ✅ Rotacionadas periodicamente

### Rate Limiting

O serviço implementa rate limiting:
- 1000 requisições por IP a cada 15 minutos
- Configurável no `src/index.ts`

---

## 🐛 Troubleshooting

### Pod não inicia

```bash
# Verificar eventos do pod
kubectl describe pod <pod-name>

# Verificar logs
kubectl logs <pod-name>

# Verificar se o secret existe
kubectl get secret lazarus-secrets
```

### Erro de conexão com banco de dados

```bash
# Verificar se as credenciais estão corretas no secret
kubectl get secret lazarus-secrets -o yaml

# Testar conectividade do pod
kubectl exec -it <pod-name> -- curl http://localhost:3011/health
```

### Erro 401 (Unauthorized)

- Verifique se a API Key está sendo enviada no header `X-API-Key`
- Verifique se a API Key no frontend corresponde à configurada no backend

### Erro 404 (Not Found)

- Verifique se o Ingress está configurado corretamente
- Verifique se o path `/guide` está correto
- Verifique se o Service está apontando para o pod correto

---

## 📚 Documentação Adicional

- **API Documentation**: `http://localhost:3011/api-docs` (Swagger)
- **Frontend Integration**: `docs/FRONTEND_INTEGRATION.md`
- **Repository**: https://github.com/caio-healthchain/ms-guide

---

## ✅ Checklist de Deploy

- [ ] Secrets criados no Kubernetes
- [ ] Imagem Docker buildada e enviada para ACR
- [ ] Deployment aplicado no cluster AKS
- [ ] Service e Ingress configurados
- [ ] Health checks respondendo corretamente
- [ ] Endpoints testados com API Key
- [ ] Frontend configurado com a URL correta
- [ ] Tela de Auditorias testada e funcionando
- [ ] Logs monitorados
- [ ] APIM configurado (opcional)

---

## 🎉 Conclusão

O microsserviço **ms-guide** está pronto para deploy! Siga os passos acima para colocá-lo em produção.

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

**Bom deploy! 🚀**
