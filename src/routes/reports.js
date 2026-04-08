const express = require('express');
const router = express.Router();
const { getAccountOverview, getCampaignReport } = require('../services/reportService');

router.get('/overview', async (req, res, next) => {
  try { res.json(await getAccountOverview(req.query.days || 7)); }
  catch (err) { next(err); }
});

router.get('/campaigns', async (req, res, next) => {
  try { res.json(await getCampaignReport(req.query.days || 30)); }
  catch (err) { next(err); }
});

module.exports = router;
