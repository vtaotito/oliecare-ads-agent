const express = require('express');
const router = express.Router();
const { createResponsiveSearchAd, getAdPerformance } = require('../services/adService');

router.post('/adgroup/:adGroupId', async (req, res, next) => {
  try { res.status(201).json(await createResponsiveSearchAd(req.params.adGroupId, req.body)); }
  catch (err) { next(err); }
});

router.get('/campaign/:campaignId/performance', async (req, res, next) => {
  try { res.json(await getAdPerformance(req.params.campaignId)); }
  catch (err) { next(err); }
});

module.exports = router;
