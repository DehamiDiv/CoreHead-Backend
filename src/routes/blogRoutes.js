// src/routes/blogRoutes.js
const { Router } = require('express');
const blogController = require('../controllers/blogController');
const postController = require('../controllers/postController');
const previewController = require('../controllers/previewController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite, optionalSite } = require('../middlewares/siteMiddleware');

const router = Router();

// ── Layout ────────────────────────────────────────────────────
// GET /api/blog/layout/:slug
// Used by: api.getPublicLayout('blog-loop')
router.get('/layout/:slug', blogController.getPublicLayout);

// ── Posts ─────────────────────────────────────────────────────
// GET /api/blog/posts/preview?limit=6&offset=0
// Used by: api.getPreviewPosts(6)
// NOTE: /preview must be declared BEFORE /:slug to avoid route conflict
router.get('/posts/preview', previewController.getPreviewPosts);

// GET /api/blog/posts/:slug
// Used by: single post pages
router.get('/posts/:slug', optionalSite, postController.getPostBySlug);

// Legacy management compatibility endpoint. Creation must never bypass the
// authenticated, site-scoped post workflow used by /api/posts.
router.post('/posts', authMiddleware, requireSite, postController.createPost);

module.exports = router;
