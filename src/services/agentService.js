const OpenAI = require('openai');
const { listCampaigns, updateCampaignStatus, updateCampaignBudget } = require('./campaignService');
const { getAccountOverview } = require('./reportService');
const { pauseKeyword } = require('./keywordService');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é o agente de otimização Google Ads da OlieCare, SaaS de rotina de bebês.
Analise os dados de campanhas e retorne ações concretas de otimização em JSON.

Regras:
- Pausar campanhas com CTR < 1% após 500 impressões
- Aumentar lance em palavras com CTR > 5% e CPC abaixo da média
- Alertar campanhas sem conversão por mais de 7 dias
- Sugerir novas palavras-chave baseado nos temas: rotina bebê, sono, alimentação, vacinas, desenvolvimento

Sempre retorne JSON no formato:
{
  "actions": [
    {
      "type": "pause_campaign|update_budget|pause_keyword|add_keywords|alert",
      "target_id": "...",
      "reason": "...",
      "params": {}
    }
  ],
  "insights": ["insight1", "insight2"],
  "summary": "resumo executivo em 1 frase"
}`;

async function analyzeAndOptimize(metricsData) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Dados atuais das campanhas OlieCare:\n${JSON.stringify(metricsData, null, 2)}\n\nQue ações de otimização você recomenda?`
      }
    ],
    response_format: { type: 'json_object' },
  });

  const text = completion.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch {
    return { actions: [], insights: [text], summary: 'Análise concluída' };
  }
}

async function executeActions(actions) {
  const results = [];
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'pause_campaign':
          await updateCampaignStatus(action.target_id, 'PAUSED');
          results.push({ action: action.type, status: 'executado', id: action.target_id });
          break;
        case 'update_budget':
          await updateCampaignBudget(action.target_id, action.params.newBudget);
          results.push({ action: action.type, status: 'executado', id: action.target_id });
          break;
        case 'pause_keyword':
          await pauseKeyword(action.params.adGroupId, action.target_id);
          results.push({ action: action.type, status: 'executado', id: action.target_id });
          break;
        case 'alert':
          logger.warn(`ALERTA AGENTE: ${action.reason}`);
          results.push({ action: action.type, status: 'alerta_registrado', reason: action.reason });
          break;
      }
    } catch (err) {
      logger.error(`Erro ao executar ação ${action.type}: ${err.message}`);
      results.push({ action: action.type, status: 'erro', error: err.message });
    }
  }
  return results;
}

async function runAgentCycle() {
  try {
    logger.info('=== CICLO DO AGENTE INICIADO ===');
    const [overview, campaigns] = await Promise.all([
      getAccountOverview(7),
      listCampaigns(),
    ]);

    const analysis = await analyzeAndOptimize({ overview, campaigns });
    logger.info(`Insights: ${analysis.insights?.length || 0} | Ações: ${analysis.actions?.length || 0}`);
    logger.info(`Resumo: ${analysis.summary}`);

    if (analysis.actions?.length > 0) {
      const results = await executeActions(analysis.actions);
      logger.info(`Ações executadas: ${JSON.stringify(results)}`);
    }

    logger.info('=== CICLO DO AGENTE CONCLUÍDO ===');
    return analysis;
  } catch (err) {
    logger.error(`Erro no ciclo do agente: ${err.message}`);
    throw err;
  }
}

module.exports = { runAgentCycle, analyzeAndOptimize };
