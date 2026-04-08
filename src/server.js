require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./utils/logger');

const campaignRoutes = require('./routes/campaigns');
const keywordRoutes = require('./routes/keywords');
const adRoutes = require('./routes/ads');
const reportRoutes = require('./routes/reports');
const agentRoutes = require('./routes/agent');
const errorHandler = require('./middleware/errorHandler');
const { runAgentCycle } = require('./services/agentService');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api/campaigns', campaignRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/agent', agentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'oliecare-ads-agent' }));

app.use(errorHandler);

cron.schedule('0 */6 * * *', async () => {
  logger.info('Iniciando ciclo automático do agente...');
  await runAgentCycle();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => logger.info(`OlieCare Ads Agent rodando na porta ${PORT}`));
