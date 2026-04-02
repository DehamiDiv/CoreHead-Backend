const express = require('express');
const router = express.Router();
const previewController = require('../controllers/previewController');

// GET /api/preview/posts - Fetch posts for the visual builder blog loop
router.get('/posts', previewController.getPreviewPosts);

module.exports = router;
