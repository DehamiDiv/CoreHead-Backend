const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireSite, optionalSite } = require('../middlewares/siteMiddleware');

// PUBLIC ROUTES (No Auth Required)
// GET /api/posts/slug/:slug  ← must be before /:id
// Optional site scope: X-Site-Id or ?siteId=
router.get('/slug/:slug', optionalSite, postController.getPostBySlug);

// PROTECTED ROUTES (Management) — require auth + site membership
router.use(authMiddleware);
router.use(requireSite);

// POST /api/posts
router.post('/', postController.createPost);

// GET /api/posts
router.get('/', postController.getPosts);

// GET /api/posts/:id
router.get('/:id', postController.getPostById);

// PUT /api/posts/:id
router.put('/:id', postController.updatePost);

// T11: publish / unpublish
router.patch('/:id/publish', postController.publishPost);
router.patch('/:id/unpublish', postController.unpublishPost);

// DELETE /api/posts/:id
router.delete('/:id', postController.deletePost);

module.exports = router;
