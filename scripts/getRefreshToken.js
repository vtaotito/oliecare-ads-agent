#!/usr/bin/env node

require('dotenv').config();
const http = require('http');
const { URL } = require('url');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = ['https://www.googleapis.com/auth/adwords'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Preencha GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET no .env antes de rodar.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n Google Ads OAuth2 - Obter Refresh Token\n');
console.log('Abra esta URL no navegador:\n');
console.log(`  ${authUrl}\n`);
console.log(`Aguardando callback em http://localhost:${REDIRECT_PORT}/callback ...\n`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('Parametro "code" ausente.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h1>Token obtido com sucesso!</h1>
        <p>Copie o <b>refresh_token</b> abaixo e cole no seu <code>.env</code>:</p>
        <pre style="background:#f4f4f4;padding:16px;border-radius:8px;word-break:break-all">${tokens.refresh_token}</pre>
        <p>Voce pode fechar esta aba.</p>
      </body></html>
    `);

    console.log('\n=== TOKENS OBTIDOS COM SUCESSO ===\n');
    console.log(`  refresh_token: ${tokens.refresh_token}`);
    console.log(`  access_token:  ${tokens.access_token?.substring(0, 40)}...`);
    console.log(`  scope:         ${tokens.scope}`);
    console.log(`  expiry_date:   ${new Date(tokens.expiry_date).toISOString()}\n`);
    console.log('Cole o refresh_token no .env como GOOGLE_ADS_REFRESH_TOKEN\n');

    server.close(() => process.exit(0));
  } catch (err) {
    res.writeHead(500);
    res.end(`Erro ao trocar codigo: ${err.message}`);
    console.error('Erro:', err.message);
  }
});

server.listen(REDIRECT_PORT);
