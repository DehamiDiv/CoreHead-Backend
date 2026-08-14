const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite } = require('../middlewares/siteMiddleware');

router.use(authMiddleware);
router.use(requireSite);

// GET /api/settings
router.get('/', settingsController.getSettings);

router.put('/appearance/draft', settingsController.saveAppearanceDraft);
router.put('/appearance/apply', settingsController.applyAppearanceDraft);

// PUT /api/settings/:key
router.put('/:key', settingsController.updateSetting);

module.exports = router;
