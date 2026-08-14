const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');

// ─── PUBLIC ROUTES (no auth required) ────────────────────────────────────────
// IMPORTANT: Must be registered BEFORE router.use(authMiddleware) so the
// frontend renderer can call this endpoint without a JWT token.

// GET /api/templates/resolve?templateType=blog&categoryId=tech
// Returns the active layout for a given type + category combination.
router.get('/resolve', templateController.resolveActiveLayout);

// ─── PROTECTED ROUTES (JWT required) ─────────────────────────────────────────
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

// PATCH /api/templates/:id/publish - Publish a layout
router.patch('/:id/publish', templateController.publishTemplate);

// POST /api/templates/:id/assign - Assign layout to a category or global default
router.post('/:id/assign', templateController.assignTemplate);

module.exports = router;
