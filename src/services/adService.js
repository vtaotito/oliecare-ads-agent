const { getCustomer } = require('../auth/googleAuth');
const logger = require('../utils/logger');

async function createResponsiveSearchAd(adGroupId, { headlines, descriptions, finalUrl }) {
  const customer = getCustomer();

  const result = await customer.adGroupAds.create([{
    ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
    status: 'PAUSED',
    ad: {
      responsive_search_ad: {
        headlines: headlines.map(text => ({ text })),
        descriptions: descriptions.map(text => ({ text })),
      },
      final_urls: [finalUrl || process.env.OLIECARE_SITE_URL],
    },
  }]);
  const ad = Array.isArray(result) ? result[0] : result.results[0];

  logger.info(`RSA criado no grupo ${adGroupId}`);
  return ad;
}

async function getAdPerformance(campaignId) {
  const customer = getCustomer();
  return await customer.query(`
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.status,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_micros
    FROM ad_group_ad
    WHERE campaign.id = ${campaignId}
    AND segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
  `);
}

module.exports = { createResponsiveSearchAd, getAdPerformance };
