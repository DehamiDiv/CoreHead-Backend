const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');

// All layout template routes require the user to be logged in (Admin access)
router.use(authMiddleware);

// POST /api/templates - Save a new layout
router.post('/', templateController.createTemplate);

// GET /api/templates - Get all layouts
router.get('/', templateController.getAllTemplates);

// GET /api/templates/:id - Get a specific layout
router.get('/:id', templateController.getTemplateById);

// PUT /api/templates/:id - Update an existing layout
router.put('/:id', templateController.updateTemplate);

// DELETE /api/templates/:id - Delete a layout
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
