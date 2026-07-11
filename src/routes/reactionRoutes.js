const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { optionalSite } = require('../middlewares/siteMiddleware');
const { commentCreateLimiter } = require('../middlewares/rateLimiters');

// Public reactions on published posts
router.get('/public', optionalSite, reactionController.getPublicReactions);
router.post('/', commentCreateLimiter, optionalSite, reactionController.reactToPost);
router.delete('/', commentCreateLimiter, optionalSite, reactionController.removeReaction);

module.exports = router;
