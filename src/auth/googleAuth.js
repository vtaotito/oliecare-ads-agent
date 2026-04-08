const { GoogleAdsApi } = require('google-ads-api');

let googleAdsClient = null;

function getGoogleAdsClient() {
  if (googleAdsClient) return googleAdsClient;

  googleAdsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  return googleAdsClient;
}

function getCustomer() {
  const client = getGoogleAdsClient();
  return client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  });
}

module.exports = { getGoogleAdsClient, getCustomer };
