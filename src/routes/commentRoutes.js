const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite, optionalSite } = require('../middlewares/siteMiddleware');
const { commentCreateLimiter } = require('../middlewares/rateLimiters');

// Public: list approved comments + create (R3-2)
router.get('/public', optionalSite, commentController.getPublicComments);
router.post('/', commentCreateLimiter, optionalSite, commentController.createComment);

// Admin moderation — auth + site scope (T15)
router.get('/', authMiddleware, requireSite, commentController.getComments);
router.put('/:id', authMiddleware, requireSite, commentController.updateCommentStatus);
router.delete('/:id', authMiddleware, requireSite, commentController.deleteComment);

module.exports = router;
