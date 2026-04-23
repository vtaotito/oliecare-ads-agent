const { getCustomer, getAccessToken } = require('../auth/googleAuth');
const axios = require('axios');
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
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const token = await getAccessToken();
  const baseUrl = `https://googleads.googleapis.com/v23/customers/${customerId}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': loginCustomerId,
    'Content-Type': 'application/json',
  };

  try {
    const budgetRes = await axios.post(`${baseUrl}/campaignBudgets:mutate`, {
      operations: [{ create: {
        name: `Budget - ${name} - ${Date.now()}`,
        amountMicros: String(budget * 1_000_000),
        deliveryMethod: 'STANDARD',
      }}],
    }, { headers });
    const budgetRN = budgetRes.data.results[0].resourceName;

    const campaignRes = await axios.post(`${baseUrl}/campaigns:mutate`, {
      operations: [{ create: {
        name,
        advertisingChannelType: 'SEARCH',
        status: 'PAUSED',
        campaignBudget: budgetRN,
        manualCpc: {},
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: true,
          targetContentNetwork: false,
        },
      }}],
    }, { headers });
    const campaign = campaignRes.data.results[0];

    logger.info(`Campanha criada: ${name} (${campaign.resourceName})`);
    return campaign;
  } catch (err) {
    const detail = err.response?.data?.error?.details?.[0]?.errors
      || err.response?.data?.error?.message
      || err.message;
    logger.error(`createCampaign error: ${JSON.stringify(detail)}`);
    const error = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    error.status = err.response?.status || 500;
    throw error;
  }
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
