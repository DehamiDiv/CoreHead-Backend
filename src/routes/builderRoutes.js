const express = require('express');
const router = express.Router();
const builderController = require('../controllers/builderController');
const authMiddleware = require('../middlewares/authMiddleware');

// All builder routes require authentication
router.use(authMiddleware);

// Routes for /api/builder/layouts
router.post('/layouts',     builderController.saveLayout);
router.get('/layouts',      builderController.getLayouts);
router.get('/layouts/:id',  builderController.getLayoutById);
router.put('/layouts/:id',  builderController.updateLayout);
router.delete('/layouts/:id', builderController.deleteLayout);

module.exports = router;
