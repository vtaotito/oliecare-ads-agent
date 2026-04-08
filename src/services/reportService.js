const { getCustomer } = require('../auth/googleAuth');

async function getAccountOverview(days = 7) {
  const customer = getCustomer();
  const period = days === 7 ? 'LAST_7_DAYS' : days === 30 ? 'LAST_30_DAYS' : 'LAST_14_DAYS';

  const results = await customer.query(`
    SELECT
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date DURING ${period}
  `);

  const m = results[0]?.metrics || {};
  return {
    period: `Últimos ${days} dias`,
    clicks: m.clicks || 0,
    impressions: m.impressions || 0,
    ctr: ((m.ctr || 0) * 100).toFixed(2) + '%',
    avgCpc: 'R$ ' + ((m.average_cpc || 0) / 1_000_000).toFixed(2),
    totalCost: 'R$ ' + ((m.cost_micros || 0) / 1_000_000).toFixed(2),
    conversions: m.conversions || 0,
    costPerConversion: m.cost_per_conversion
      ? 'R$ ' + (m.cost_per_conversion / 1_000_000).toFixed(2)
      : 'N/A',
  };
}

async function getCampaignReport(days = 30) {
  const customer = getCustomer();
  return await customer.query(`
    SELECT
      campaign.name,
      campaign.status,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    AND segments.date DURING LAST_${days}_DAYS
    ORDER BY metrics.cost_micros DESC
  `);
}

module.exports = { getAccountOverview, getCampaignReport };
