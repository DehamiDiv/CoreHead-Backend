const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite, optionalSite } = require('../middlewares/siteMiddleware');

// PUBLIC: resolve layout (optional site scope via X-Site-Id / ?siteId=)
router.get('/resolve', optionalSite, templateController.resolveActiveLayout);

// PROTECTED + site-scoped
router.use(authMiddleware);
router.use(requireSite);

router.post('/', templateController.createTemplate);
router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.patch('/:id/publish', templateController.publishTemplate);
router.post('/:id/assign', templateController.assignTemplate);

module.exports = router;
