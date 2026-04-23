// src/routes/blogRoutes.js
const { Router } = require('express');
const blogController = require('../controllers/blogController');

const router = Router();

// ── Layout ────────────────────────────────────────────────────
// GET /api/blog/layout/:slug
// Used by: api.getPublicLayout('blog-loop')
router.get('/layout/:slug', blogController.getPublicLayout);

// ── Posts ─────────────────────────────────────────────────────
// GET /api/blog/posts/preview?limit=6&offset=0
// Used by: api.getPreviewPosts(6)
// NOTE: /preview must be declared BEFORE /:slug to avoid route conflict
router.get('/posts/preview', blogController.getPreviewPosts);

// GET /api/blog/posts/:slug
// Used by: single post pages
router.get('/posts/:slug', blogController.getPostBySlug);

module.exports = router;