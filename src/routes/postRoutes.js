const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// POST /api/posts
router.post('/', postController.createPost);

// GET /api/posts
router.get('/', postController.getPosts);

// GET /api/posts/:id
router.get('/:id', postController.getPostById);

// PUT /api/posts/:id
router.put('/:id', postController.updatePost);

// DELETE /api/posts/:id
router.delete('/:id', postController.deletePost);

module.exports = router;
