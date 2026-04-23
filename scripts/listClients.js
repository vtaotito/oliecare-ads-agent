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
  console.log('=== Manager Account Info ===');
  const mgr = await customer.query(
    'SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account FROM customer LIMIT 1'
  );
  console.log(JSON.stringify(mgr, null, 2));

  console.log('\n=== Client Accounts (Level 1) ===');
  const clients = await customer.query(
    'SELECT customer_client.id, customer_client.descriptive_name, customer_client.status, customer_client.manager, customer_client.test_account, customer_client.level FROM customer_client WHERE customer_client.level = 1'
  );
  console.log(JSON.stringify(clients, null, 2));
}

main().catch(e => {
  console.log('Error:', e.errors ? JSON.stringify(e.errors, null, 2) : e.message);
});
