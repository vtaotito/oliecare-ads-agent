const { GoogleAdsApi } = require('google-ads-api');
const axios = require('axios');

let googleAdsClient = null;
let cachedToken = null;
let tokenExpiresAt = 0;

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

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const { data } = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

module.exports = { getGoogleAdsClient, getCustomer, getAccessToken };
