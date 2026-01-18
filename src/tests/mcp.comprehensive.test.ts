import { OpenAI } from 'openai';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Suite Completa de Testes para MCP do ms-guide
 * Testa todos os casos de uso com OpenAI
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyticsService = new AnalyticsService();
const hospitalId = 'hosp_sagrada_familia_001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Teste 1: get_daily_guides_summary
 */
async function testDailySummary() {
  try {
    console.log('\n📋 Testando: get_daily_guides_summary');
    
    const today = new Date();
    const summary = await analyticsService.getDailySummary(today, hospitalId);
    
    const passed = 
      summary.total !== undefined &&
      summary.finalizadas !== undefined &&
      summary.em_andamento !== undefined &&
      summary.canceladas !== undefined &&
      summary.valor_total !== undefined;

    results.push({
      name: 'get_daily_guides_summary',
      passed,
      message: passed 
        ? `Resumo diário obtido com sucesso`
        : 'Dados incompletos',
      data: summary,
    });

    console.log(`   Total: ${summary.total}`);
    console.log(`   Finalizadas: ${summary.finalizadas}`);
    console.log(`   Em andamento: ${summary.em_andamento}`);
    console.log(`   Canceladas: ${summary.canceladas}`);
    console.log(`   Valor total: R$ ${summary.valor_total.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_daily_guides_summary',
      passed: false,
      message: `Erro ao buscar resumo diário`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 2: get_guides_by_status - FINALIZADA
 */
async function testGuidesByStatusFinalizada() {
  try {
    console.log('\n📋 Testando: get_guides_by_status (FINALIZADA)');
    
    const today = new Date();
    const guides = await analyticsService.getGuidesByStatus('FINALIZADA', today, 10, hospitalId);
    
    const passed = Array.isArray(guides);

    results.push({
      name: 'get_guides_by_status (FINALIZADA)',
      passed,
      message: passed 
        ? `${guides.length} guias finalizadas encontradas`
        : 'Resposta inválida',
      data: { count: guides.length, samples: guides.slice(0, 2) },
    });

    console.log(`   Encontradas: ${guides.length} guias`);
    if (guides.length > 0) {
      console.log(`   Primeira guia: ${guides[0].numeroGuiaPrestador}`);
    }
  } catch (error: any) {
    results.push({
      name: 'get_guides_by_status (FINALIZADA)',
      passed: false,
      message: `Erro ao buscar guias finalizadas`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 3: get_guides_by_status - EM_ANDAMENTO
 */
async function testGuidesByStatusEmAndamento() {
  try {
    console.log('\n📋 Testando: get_guides_by_status (EM_ANDAMENTO)');
    
    const today = new Date();
    const guides = await analyticsService.getGuidesByStatus('EM_ANDAMENTO', today, 10, hospitalId);
    
    const passed = Array.isArray(guides);

    results.push({
      name: 'get_guides_by_status (EM_ANDAMENTO)',
      passed,
      message: passed 
        ? `${guides.length} guias em andamento encontradas`
        : 'Resposta inválida',
      data: { count: guides.length, samples: guides.slice(0, 2) },
    });

    console.log(`   Encontradas: ${guides.length} guias`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_by_status (EM_ANDAMENTO)',
      passed: false,
      message: `Erro ao buscar guias em andamento`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 4: get_guides_by_status - CANCELADA
 */
async function testGuidesByStatusCancelada() {
  try {
    console.log('\n📋 Testando: get_guides_by_status (CANCELADA)');
    
    const today = new Date();
    const guides = await analyticsService.getGuidesByStatus('CANCELADA', today, 10, hospitalId);
    
    const passed = Array.isArray(guides);

    results.push({
      name: 'get_guides_by_status (CANCELADA)',
      passed,
      message: passed 
        ? `${guides.length} guias canceladas encontradas`
        : 'Resposta inválida',
      data: { count: guides.length },
    });

    console.log(`   Encontradas: ${guides.length} guias`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_by_status (CANCELADA)',
      passed: false,
      message: `Erro ao buscar guias canceladas`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 5: get_guides_statistics - day
 */
async function testStatisticsDay() {
  try {
    console.log('\n📋 Testando: get_guides_statistics (day)');
    
    const today = new Date();
    const stats = await analyticsService.getStatistics('day', today, hospitalId);
    
    const passed = 
      stats.total_guias !== undefined &&
      stats.taxa_finalizacao !== undefined &&
      stats.valor_total !== undefined;

    results.push({
      name: 'get_guides_statistics (day)',
      passed,
      message: passed 
        ? `Estatísticas do dia obtidas com sucesso`
        : 'Dados incompletos',
      data: stats,
    });

    console.log(`   Total de guias: ${stats.total_guias}`);
    console.log(`   Taxa de finalização: ${stats.taxa_finalizacao}%`);
    console.log(`   Valor total: R$ ${stats.valor_total.toFixed(2)}`);
    console.log(`   Procedimentos: ${stats.procedimentos_total}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_statistics (day)',
      passed: false,
      message: `Erro ao buscar estatísticas do dia`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 6: get_guides_statistics - week
 */
async function testStatisticsWeek() {
  try {
    console.log('\n📋 Testando: get_guides_statistics (week)');
    
    const today = new Date();
    const stats = await analyticsService.getStatistics('week', today, hospitalId);
    
    const passed = stats.total_guias !== undefined;

    results.push({
      name: 'get_guides_statistics (week)',
      passed,
      message: passed 
        ? `Estatísticas da semana obtidas com sucesso`
        : 'Dados incompletos',
      data: stats,
    });

    console.log(`   Total de guias (semana): ${stats.total_guias}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_statistics (week)',
      passed: false,
      message: `Erro ao buscar estatísticas da semana`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 7: get_guides_statistics - month
 */
async function testStatisticsMonth() {
  try {
    console.log('\n📋 Testando: get_guides_statistics (month)');
    
    const today = new Date();
    const stats = await analyticsService.getStatistics('month', today, hospitalId);
    
    const passed = stats.total_guias !== undefined;

    results.push({
      name: 'get_guides_statistics (month)',
      passed,
      message: passed 
        ? `Estatísticas do mês obtidas com sucesso`
        : 'Dados incompletos',
      data: stats,
    });

    console.log(`   Total de guias (mês): ${stats.total_guias}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_statistics (month)',
      passed: false,
      message: `Erro ao buscar estatísticas do mês`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 8: get_guides_revenue - day
 */
async function testRevenueDay() {
  try {
    console.log('\n📋 Testando: get_guides_revenue (day)');
    
    const today = new Date();
    const revenue = await analyticsService.getRevenue('day', today, hospitalId);
    
    const passed = 
      revenue.receita_total !== undefined &&
      revenue.guias_faturadas !== undefined &&
      Array.isArray(revenue.por_tipo_faturamento);

    results.push({
      name: 'get_guides_revenue (day)',
      passed,
      message: passed 
        ? `Receita do dia obtida com sucesso`
        : 'Dados incompletos',
      data: revenue,
    });

    console.log(`   Receita total: R$ ${revenue.receita_total.toFixed(2)}`);
    console.log(`   Guias faturadas: ${revenue.guias_faturadas}`);
    console.log(`   Valor médio: R$ ${revenue.valor_medio_guia.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_revenue (day)',
      passed: false,
      message: `Erro ao buscar receita do dia`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 9: get_guides_revenue - week
 */
async function testRevenueWeek() {
  try {
    console.log('\n📋 Testando: get_guides_revenue (week)');
    
    const today = new Date();
    const revenue = await analyticsService.getRevenue('week', today, hospitalId);
    
    const passed = revenue.receita_total !== undefined;

    results.push({
      name: 'get_guides_revenue (week)',
      passed,
      message: passed 
        ? `Receita da semana obtida com sucesso`
        : 'Dados incompletos',
      data: revenue,
    });

    console.log(`   Receita total (semana): R$ ${revenue.receita_total.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_revenue (week)',
      passed: false,
      message: `Erro ao buscar receita da semana`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 10: Validação com OpenAI
 */
async function validateWithOpenAI() {
  try {
    console.log('\n\n🤖 Validando resultados com OpenAI...\n');

    const testSummary = results
      .map(
        (r) =>
          `- ${r.name}: ${r.passed ? '✅ PASSOU' : '❌ FALHOU'} - ${r.message}`
      )
      .join('\n');

    const prompt = `
Você é um especialista em QA de APIs. Analise os seguintes resultados de testes do MCP do ms-guide:

${testSummary}

Dados dos testes:
${JSON.stringify(results.map(r => ({ name: r.name, passed: r.passed, data: r.data })), null, 2)}

Por favor, forneça:
1. Um resumo geral do status dos testes
2. Quais testes passaram e quais falharam
3. Análise dos dados retornados (se estão corretos e completos)
4. Recomendações para melhorias ou correções
5. Se há algum problema crítico que precisa ser corrigido

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
    console.log('═'.repeat(80));
    console.log(analysis);
    console.log('═'.repeat(80));
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error.message);
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🧪 SUITE DE TESTES COMPLETA DO MCP ms-guide');
  console.log('═'.repeat(80));
  console.log(`Hospital: ${hospitalId}`);
  console.log(`Data: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));

  await testDailySummary();
  await testGuidesByStatusFinalizada();
  await testGuidesByStatusEmAndamento();
  await testGuidesByStatusCancelada();
  await testStatisticsDay();
  await testStatisticsWeek();
  await testStatisticsMonth();
  await testRevenueDay();
  await testRevenueWeek();

  // Exibir resumo
  console.log('\n\n📊 RESUMO DOS TESTES');
  console.log('═'.repeat(80));

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(
    `📈 Resultado Final: ${passedCount}/${totalCount} testes passaram (${Math.round((passedCount / totalCount) * 100)}%)\n`
  );

  // Validar com OpenAI
  await validateWithOpenAI();
}

// Executar testes
runAllTests().catch(console.error);
