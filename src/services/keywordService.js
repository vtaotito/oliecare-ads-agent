const { getCustomer } = require('../auth/googleAuth');
const logger = require('../utils/logger');

async function getKeywordPerformance(campaignId) {
  const customer = getCustomer();
  return await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_micros,
      quality_info.quality_score
    FROM keyword_view
    WHERE campaign.id = ${campaignId}
    AND segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
  `);
}

async function addKeywords(adGroupId, keywords) {
  const customer = getCustomer();
  const criteria = keywords.map(kw => ({
    ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
    status: 'ENABLED',
    keyword: {
      text: kw.text,
      match_type: kw.matchType || 'BROAD',
    },
    cpc_bid_micros: kw.bidMicros || 1_000_000,
  }));

  const result = await customer.adGroupCriteria.create(criteria);
  logger.info(`${keywords.length} palavras-chave adicionadas ao grupo ${adGroupId}`);
  return result;
}

async function pauseKeyword(adGroupId, criterionId) {
  const customer = getCustomer();
  await customer.adGroupCriteria.update([{
    resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}/criteria/${criterionId}`,
    status: 'PAUSED',
  }]);
}

async function addNegativeKeywords(campaignId, negativeKeywords) {
  const customer = getCustomer();
  const criteria = negativeKeywords.map(kw => ({
    campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    keyword: { text: kw, match_type: 'BROAD' },
  }));
  await customer.campaignCriteria.create(criteria);
  logger.info(`${negativeKeywords.length} palavras negativas adicionadas à campanha ${campaignId}`);
}

module.exports = { getKeywordPerformance, addKeywords, pauseKeyword, addNegativeKeywords };
