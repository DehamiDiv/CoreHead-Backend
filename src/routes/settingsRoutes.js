const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite } = require('../middlewares/siteMiddleware');

router.use(authMiddleware);
router.use(requireSite);

// GET /api/settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/:key
router.put('/:key', settingsController.updateSetting);

module.exports = router;
