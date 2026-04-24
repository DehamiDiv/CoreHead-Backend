const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// POST /api/posts
router.post('/', postController.createPost);

// GET /api/posts
router.get('/', postController.getPosts);

module.exports = router;
