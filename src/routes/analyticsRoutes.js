const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite } = require('../middlewares/siteMiddleware');

// Public endpoint called when a reader opens a published post
router.post('/track', analyticsController.trackPostView);

// Admin overview for /admin dashboard
router.get('/overview', authMiddleware, requireSite, analyticsController.getAnalyticsOverview);

module.exports = router;
