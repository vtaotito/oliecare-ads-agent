const { getCustomer } = require('../auth/googleAuth');
const logger = require('../utils/logger');

async function listCampaigns() {
  const customer = getCustomer();
  const campaigns = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    AND segments.date DURING LAST_7_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `);

  return campaigns.map(c => ({
    id: c.campaign.id,
    name: c.campaign.name,
    status: c.campaign.status,
    type: c.campaign.advertising_channel_type,
    dailyBudget: (c.campaign_budget.amount_micros / 1_000_000).toFixed(2),
    metrics: {
      clicks: c.metrics.clicks,
      impressions: c.metrics.impressions,
      ctr: ((c.metrics.ctr || 0) * 100).toFixed(2) + '%',
      avgCpc: 'R$ ' + ((c.metrics.average_cpc || 0) / 1_000_000).toFixed(2),
      cost: 'R$ ' + (c.metrics.cost_micros / 1_000_000).toFixed(2),
    }
  }));
}

async function createCampaign({ name, budget, targetCpa, startDate, endDate }) {
  const customer = getCustomer();

  const budgetResult = await customer.campaignBudgets.create([{
    name: `Budget - ${name} - ${Date.now()}`,
    amount_micros: budget * 1_000_000,
    delivery_method: 'STANDARD',
  }]);
  const budgetResourceName = Array.isArray(budgetResult)
    ? budgetResult[0].resource_name
    : budgetResult.results[0].resource_name;

  const campaignResult = await customer.campaigns.create([{
    name,
    advertising_channel_type: 'SEARCH',
    status: 'PAUSED',
    campaign_budget: budgetResourceName,
    manual_cpc: { enhanced_cpc_enabled: true },
    network_settings: {
      target_google_search: true,
      target_search_network: true,
      target_content_network: false,
    },
    start_date: startDate || new Date().toISOString().split('T')[0].replace(/-/g, ''),
  }]);
  const campaign = Array.isArray(campaignResult)
    ? campaignResult[0]
    : campaignResult.results[0];

  logger.info(`Campanha criada: ${name} (${campaign.resource_name})`);
  return campaign;
}

async function updateCampaignStatus(campaignId, status) {
  const customer = getCustomer();
  await customer.campaigns.update([{
    resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    status,
  }]);
  logger.info(`Status da campanha ${campaignId} → ${status}`);
}

async function updateCampaignBudget(campaignId, newBudgetAmountBrl) {
  const customer = getCustomer();
  const campaigns = await customer.query(`
    SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = ${campaignId}
  `);
  const budgetResource = campaigns[0]?.campaign?.campaign_budget;
  if (!budgetResource) throw new Error('Campanha não encontrada');

  await customer.campaignBudgets.update([{
    resource_name: budgetResource,
    amount_micros: newBudgetAmountBrl * 1_000_000,
  }]);
  logger.info(`Orçamento campanha ${campaignId} → R$${newBudgetAmountBrl}/dia`);
}

module.exports = { listCampaigns, createCampaign, updateCampaignStatus, updateCampaignBudget };
