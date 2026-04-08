const express = require('express');
const router = express.Router();
const { getKeywordPerformance, addKeywords, addNegativeKeywords } = require('../services/keywordService');

router.get('/campaign/:campaignId', async (req, res, next) => {
  try { res.json(await getKeywordPerformance(req.params.campaignId)); }
  catch (err) { next(err); }
});

router.post('/adgroup/:adGroupId', async (req, res, next) => {
  try { res.status(201).json(await addKeywords(req.params.adGroupId, req.body.keywords)); }
  catch (err) { next(err); }
});

router.post('/negative/:campaignId', async (req, res, next) => {
  try {
    await addNegativeKeywords(req.params.campaignId, req.body.keywords);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
