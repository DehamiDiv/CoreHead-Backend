const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite } = require('../middlewares/siteMiddleware');

// Public subscription endpoint
router.post('/subscribe', newsletterController.subscribe);

// Admin subscriber & campaign management
router.get('/subscribers', authMiddleware, requireSite, newsletterController.getSubscribers);
router.get('/subscribers/export', authMiddleware, requireSite, newsletterController.exportSubscribersCsv);
router.delete('/subscribers/:id', authMiddleware, requireSite, newsletterController.deleteSubscriber);

router.get('/campaigns', authMiddleware, requireSite, newsletterController.getCampaigns);
router.post('/campaigns', authMiddleware, requireSite, newsletterController.createCampaign);
router.delete('/campaigns/:id', authMiddleware, requireSite, newsletterController.deleteCampaign);

module.exports = router;
