import { OpenAI } from 'openai';

/**
 * Testes do ms-guide com OpenAI
 * Valida se os endpoints retornam dados corretos
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_BASE_URL = 'http://localhost:3011';
const API_KEY = 'test-api-key';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  response?: any;
}

const results: TestResult[] = [];

async function makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<{ status: number; data: any }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data: any = await response.json();
  return { status: response.status, data };
}

async function testHealthCheck() {
  try {
    const { status, data }: any = await makeRequest('/health');
    const passed = status === 200 && data.status === 'healthy';
    results.push({
      name: 'Health Check',
      passed,
      message: passed ? 'Servidor está saudável' : 'Servidor não está respondendo corretamente',
      response: data,
    });
  } catch (error: any) {
    results.push({
      name: 'Health Check',
      passed: false,
      message: `Erro: ${error.message}`,
    });
  }
}

async function testGetAllGuides() {
  try {
    const { status, data }: any = await makeRequest('/api/v1/guides');
    const passed = status === 200 && data.data && data.data.length > 0;
    results.push({
      name: 'GET /api/v1/guides',
      passed,
      message: passed
        ? `Retornou ${data.data.length} guias`
        : 'Nenhuma guia retornada',
      response: {
        total: data.total,
        count: data.data.length,
        firstGuide: data.data[0]?.numeroGuiaPrestador,
      },
    });
  } catch (error: any) {
    results.push({
      name: 'GET /api/v1/guides',
      passed: false,
      message: `Erro: ${error.message}`,
    });
  }
}

async function testGetGuideStats() {
  try {
    const { status, data }: any = await makeRequest('/api/v1/guides/stats');
    const passed = status === 200 && data.data && data.data.countByType;
    results.push({
      name: 'GET /api/v1/guides/stats',
      passed,
      message: passed
        ? `Retornou estatísticas: ${JSON.stringify(data.data.countByType)}`
        : 'Estatísticas não retornadas',
      response: data.data,
    });
  } catch (error: any) {
    results.push({
      name: 'GET /api/v1/guides/stats',
      passed: false,
      message: `Erro: ${error.message}`,
    });
  }
}

async function testGetGuideProcedures() {
  try {
    // Primeiro obter uma guia
    const { data: guidesData }: any = await makeRequest('/api/v1/guides?limit=1');
    if (!guidesData.data || guidesData.data.length === 0) {
      results.push({
        name: 'GET /api/v1/guides/:numeroGuiaPrestador/procedures',
        passed: false,
        message: 'Nenhuma guia disponível para testar',
      });
      return;
    }

    const numeroGuia = guidesData.data[0].numeroGuiaPrestador;
    const { status, data }: any = await makeRequest(
      `/api/v1/guides/${numeroGuia}/procedures`
    );

    const passed = status === 200 && data.data && data.data.length > 0;
    results.push({
      name: 'GET /api/v1/guides/:numeroGuiaPrestador/procedures',
      passed,
      message: passed
        ? `Retornou ${data.data.length} procedimentos para guia ${numeroGuia}`
        : 'Nenhum procedimento retornado',
      response: {
        numeroGuia,
        procedimentosCount: data.data?.length || 0,
      },
    });
  } catch (error: any) {
    results.push({
      name: 'GET /api/v1/guides/:numeroGuiaPrestador/procedures',
      passed: false,
      message: `Erro: ${error.message}`,
    });
  }
}

async function testHospitalIdFilter() {
  try {
    const { status, data }: any = await makeRequest('/api/v1/guides?hospitalId=hosp_sagrada_familia_001');
    const passed =
      status === 200 &&
      data.data &&
      data.data.every((g: any) => g.hospitalId === 'hosp_sagrada_familia_001');

    results.push({
      name: 'Hospital ID Filter',
      passed,
      message: passed
        ? `Todas as ${data.data.length} guias têm hospitalId correto`
        : 'Algumas guias têm hospitalId incorreto',
      response: {
        total: data.total,
        allHaveCorrectHospital: data.data?.every(
          (g: any) => g.hospitalId === 'hosp_sagrada_familia_001'
        ),
      },
    });
  } catch (error: any) {
    results.push({
      name: 'Hospital ID Filter',
      passed: false,
      message: `Erro: ${error.message}`,
    });
  }
}

async function validateWithOpenAI() {
  try {
    // Preparar resumo dos testes
    const testSummary = results
      .map(
        (r) =>
          `- ${r.name}: ${r.passed ? '✅ PASSOU' : '❌ FALHOU'} - ${r.message}`
      )
      .join('\n');

    const prompt = `
Você é um especialista em QA de APIs. Analise os seguintes resultados de testes do microsserviço ms-guide:

${testSummary}

Respostas dos testes:
${JSON.stringify(results.map(r => ({ name: r.name, response: r.response })), null, 2)}

Por favor, forneça:
1. Um resumo geral do status dos testes
2. Quais testes passaram e quais falharam
3. Recomendações para melhorias
4. Se há algum problema crítico que precisa ser corrigido

Seja conciso e direto.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content || '';
    console.log('\n\n=== ANÁLISE DO OPENAI ===\n');
    console.log(analysis);
    console.log('\n=== FIM DA ANÁLISE ===\n');
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando testes do ms-guide...\n');

  await testHealthCheck();
  await testGetAllGuides();
  await testGetGuideStats();
  await testGetGuideProcedures();
  await testHospitalIdFilter();

  // Exibir resultados
  console.log('\n📋 RESULTADOS DOS TESTES:\n');
  console.log('═'.repeat(80));

  results.forEach((result) => {
    const status = result.passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`\n${status} - ${result.name}`);
    console.log(`   Mensagem: ${result.message}`);
    if (result.response) {
      console.log(`   Resposta: ${JSON.stringify(result.response)}`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(
    `\n📊 Resumo: ${passedCount}/${totalCount} testes passaram (${Math.round((passedCount / totalCount) * 100)}%)\n`
  );

  // Validar com OpenAI
  await validateWithOpenAI();
}

// Executar testes
runAllTests().catch(console.error);
