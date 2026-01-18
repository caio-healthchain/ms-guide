import { OpenAI } from 'openai';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Suite de Testes do MCP com Dados Reais
 * Testa usando a data em que as guias foram criadas (18/12/2025)
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
 * Teste 1: get_daily_guides_summary com data real
 */
async function testDailySummaryWithData() {
  try {
    console.log('\n📋 Testando: get_daily_guides_summary (18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const summary = await analyticsService.getDailySummary(dataGuias, hospitalId);
    
    const passed = 
      summary.total > 0 &&
      summary.finalizadas !== undefined &&
      summary.em_andamento !== undefined &&
      summary.canceladas !== undefined &&
      summary.valor_total !== undefined;

    results.push({
      name: 'get_daily_guides_summary (com dados)',
      passed,
      message: passed 
        ? `✅ ${summary.total} guias encontradas`
        : `❌ Nenhuma guia encontrada`,
      data: summary,
    });

    console.log(`   Total: ${summary.total}`);
    console.log(`   Finalizadas: ${summary.finalizadas}`);
    console.log(`   Em andamento: ${summary.em_andamento}`);
    console.log(`   Canceladas: ${summary.canceladas}`);
    console.log(`   Valor total: R$ ${summary.valor_total.toFixed(2)}`);
    console.log(`   Valor médio: R$ ${summary.valor_medio.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_daily_guides_summary (com dados)',
      passed: false,
      message: `❌ Erro ao buscar resumo diário`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 2: get_guides_by_status - FINALIZADA com data real
 */
async function testGuidesByStatusFinalizadaWithData() {
  try {
    console.log('\n📋 Testando: get_guides_by_status (FINALIZADA, 18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const guides = await analyticsService.getGuidesByStatus('FINALIZADA', dataGuias, 10, hospitalId);
    
    const passed = Array.isArray(guides) && guides.length > 0;

    results.push({
      name: 'get_guides_by_status (FINALIZADA com dados)',
      passed,
      message: passed 
        ? `✅ ${guides.length} guias finalizadas encontradas`
        : `⚠️ ${guides.length} guias finalizadas encontradas`,
      data: { count: guides.length, samples: guides.slice(0, 2) },
    });

    console.log(`   Encontradas: ${guides.length} guias`);
    if (guides.length > 0) {
      console.log(`   Primeira guia: ${guides[0].numeroGuiaPrestador}`);
      console.log(`   Valor: R$ ${guides[0].valorTotalGeral?.toFixed(2) || 'N/A'}`);
    }
  } catch (error: any) {
    results.push({
      name: 'get_guides_by_status (FINALIZADA com dados)',
      passed: false,
      message: `❌ Erro ao buscar guias finalizadas`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 3: get_guides_statistics - day com data real
 */
async function testStatisticsDayWithData() {
  try {
    console.log('\n📋 Testando: get_guides_statistics (day, 18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const stats = await analyticsService.getStatistics('day', dataGuias, hospitalId);
    
    const passed = 
      stats.total_guias > 0 &&
      stats.taxa_finalizacao !== undefined &&
      stats.valor_total !== undefined;

    results.push({
      name: 'get_guides_statistics (day com dados)',
      passed,
      message: passed 
        ? `✅ Estatísticas do dia obtidas com sucesso`
        : `⚠️ Dados incompletos`,
      data: stats,
    });

    console.log(`   Total de guias: ${stats.total_guias}`);
    console.log(`   Finalizadas: ${stats.guias_finalizadas}`);
    console.log(`   Em andamento: ${stats.guias_em_andamento}`);
    console.log(`   Canceladas: ${stats.guias_canceladas}`);
    console.log(`   Taxa de finalização: ${stats.taxa_finalizacao}%`);
    console.log(`   Valor total: R$ ${stats.valor_total.toFixed(2)}`);
    console.log(`   Valor médio: R$ ${stats.valor_medio_guia.toFixed(2)}`);
    console.log(`   Procedimentos: ${stats.procedimentos_total}`);
    console.log(`   Procedimentos por guia: ${stats.procedimentos_por_guia.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_statistics (day com dados)',
      passed: false,
      message: `❌ Erro ao buscar estatísticas do dia`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 4: get_guides_revenue - day com data real
 */
async function testRevenueDayWithData() {
  try {
    console.log('\n📋 Testando: get_guides_revenue (day, 18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const revenue = await analyticsService.getRevenue('day', dataGuias, hospitalId);
    
    const passed = 
      revenue.receita_total !== undefined &&
      revenue.guias_faturadas !== undefined &&
      Array.isArray(revenue.por_tipo_faturamento);

    results.push({
      name: 'get_guides_revenue (day com dados)',
      passed,
      message: passed 
        ? `✅ Receita do dia obtida com sucesso`
        : `⚠️ Dados incompletos`,
      data: revenue,
    });

    console.log(`   Receita total: R$ ${revenue.receita_total.toFixed(2)}`);
    console.log(`   Guias faturadas: ${revenue.guias_faturadas}`);
    console.log(`   Valor médio: R$ ${revenue.valor_medio_guia.toFixed(2)}`);
    console.log(`   Valor procedimentos: R$ ${revenue.valor_total_procedimentos.toFixed(2)}`);
    console.log(`   Valor materiais: R$ ${revenue.valor_total_materiais.toFixed(2)}`);
    console.log(`   Valor medicamentos: R$ ${revenue.valor_total_medicamentos.toFixed(2)}`);
    console.log(`   Tipos de faturamento: ${revenue.por_tipo_faturamento.length}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_revenue (day com dados)',
      passed: false,
      message: `❌ Erro ao buscar receita do dia`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 5: get_guides_statistics - week com data real
 */
async function testStatisticsWeekWithData() {
  try {
    console.log('\n📋 Testando: get_guides_statistics (week, 18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const stats = await analyticsService.getStatistics('week', dataGuias, hospitalId);
    
    const passed = stats.total_guias > 0;

    results.push({
      name: 'get_guides_statistics (week com dados)',
      passed,
      message: passed 
        ? `✅ ${stats.total_guias} guias encontradas na semana`
        : `⚠️ Nenhuma guia encontrada na semana`,
      data: stats,
    });

    console.log(`   Total de guias (semana): ${stats.total_guias}`);
    console.log(`   Valor total: R$ ${stats.valor_total.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_statistics (week com dados)',
      passed: false,
      message: `❌ Erro ao buscar estatísticas da semana`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 6: get_guides_revenue - week com data real
 */
async function testRevenueWeekWithData() {
  try {
    console.log('\n📋 Testando: get_guides_revenue (week, 18/12/2025)');
    
    const dataGuias = new Date('2025-12-18');
    const revenue = await analyticsService.getRevenue('week', dataGuias, hospitalId);
    
    const passed = revenue.receita_total !== undefined;

    results.push({
      name: 'get_guides_revenue (week com dados)',
      passed,
      message: passed 
        ? `✅ Receita da semana: R$ ${revenue.receita_total.toFixed(2)}`
        : `⚠️ Dados incompletos`,
      data: revenue,
    });

    console.log(`   Receita total (semana): R$ ${revenue.receita_total.toFixed(2)}`);
    console.log(`   Guias faturadas: ${revenue.guias_faturadas}`);
  } catch (error: any) {
    results.push({
      name: 'get_guides_revenue (week com dados)',
      passed: false,
      message: `❌ Erro ao buscar receita da semana`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Validação com OpenAI
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
Você é um especialista em QA de APIs de Analytics. Analise os seguintes resultados de testes do MCP do ms-guide com dados reais:

${testSummary}

Dados dos testes (resumo):
${JSON.stringify(results.map(r => ({ 
  name: r.name, 
  passed: r.passed, 
  data: r.data ? {
    total: r.data.total_guias || r.data.total,
    receita: r.data.receita_total,
    guias_faturadas: r.data.guias_faturadas
  } : null
})), null, 2)}

Por favor, forneça:
1. Um resumo geral do status dos testes
2. Análise da qualidade dos dados retornados
3. Se os valores estão corretos e coerentes
4. Recomendações para melhorias
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
  console.log('🧪 SUITE DE TESTES DO MCP COM DADOS REAIS');
  console.log('═'.repeat(80));
  console.log(`Hospital: ${hospitalId}`);
  console.log(`Data das guias: 18/12/2025`);
  console.log(`Data do teste: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));

  await testDailySummaryWithData();
  await testGuidesByStatusFinalizadaWithData();
  await testStatisticsDayWithData();
  await testRevenueDayWithData();
  await testStatisticsWeekWithData();
  await testRevenueWeekWithData();

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
