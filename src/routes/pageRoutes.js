const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite, optionalSite } = require('../middlewares/siteMiddleware');

// PUBLIC — published page by slug (must be before /:id)
// GET /api/pages/public/:slug?siteId=
router.get(
  '/public/:slug',
  optionalSite,
  pageController.getPublicPageBySlug
);

// PROTECTED — auth + site membership
router.use(authMiddleware);
router.use(requireSite);

router.get('/', pageController.getPages);
router.post('/', pageController.createPage);
router.get('/:id', pageController.getPageById);
router.put('/:id', pageController.updatePage);
router.delete('/:id', pageController.deletePage);

module.exports = router;
