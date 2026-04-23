require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
});

async function main() {
  console.log('Creating budget...');
  const budgetResult = await customer.campaignBudgets.create([{
    name: 'Test Budget ' + Date.now(),
    amount_micros: 10 * 1_000_000,
    delivery_method: 'STANDARD',
  }]);
  console.log('Budget result type:', typeof budgetResult, Array.isArray(budgetResult));
  console.log('Budget result:', JSON.stringify(budgetResult, null, 2).substring(0, 500));

  const budgetRN = Array.isArray(budgetResult)
    ? budgetResult[0].resource_name
    : budgetResult.results[0].resource_name;
  console.log('Budget resource_name:', budgetRN);

  console.log('\nCreating campaign...');
  try {
    const campaignResult = await customer.campaigns.create([{
      name: 'Test Campaign ' + Date.now(),
      advertising_channel_type: 'SEARCH',
      status: 'PAUSED',
      campaign_budget: budgetRN,
      manual_cpc: {},
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
      },
      start_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      contains_eu_political_advertising: false,
    }]);
    console.log('Campaign result:', JSON.stringify(campaignResult, null, 2).substring(0, 500));
  } catch (e) {
    console.log('Campaign error:', e.errors ? JSON.stringify(e.errors, null, 2) : e.message);
  }
}

main().catch(e => console.error('Fatal:', e.message));
