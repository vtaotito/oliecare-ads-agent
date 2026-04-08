const express = require('express');
const router = express.Router();
const { runAgentCycle, analyzeAndOptimize } = require('../services/agentService');
const { getAccountOverview } = require('../services/reportService');
const { listCampaigns } = require('../services/campaignService');

router.post('/run', async (req, res, next) => {
  try {
    const result = await runAgentCycle();
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

router.post('/analyze', async (req, res, next) => {
  try {
    const [overview, campaigns] = await Promise.all([
      getAccountOverview(7),
      listCampaigns(),
    ]);
    const analysis = await analyzeAndOptimize({ overview, campaigns });
    res.json({ success: true, analysis });
  } catch (err) { next(err); }
});

module.exports = router;
