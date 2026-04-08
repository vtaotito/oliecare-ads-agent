const express = require('express');
const router = express.Router();
const {
  listCampaigns, createCampaign, updateCampaignStatus, updateCampaignBudget
} = require('../services/campaignService');

router.get('/', async (req, res, next) => {
  try { res.json(await listCampaigns()); }
  catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await createCampaign(req.body)); }
  catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    await updateCampaignStatus(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/budget', async (req, res, next) => {
  try {
    await updateCampaignBudget(req.params.id, req.body.budget);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
