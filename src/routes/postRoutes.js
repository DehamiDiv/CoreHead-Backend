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
// Preview endpoint — returns limited posts for builder preview
router.get('/preview/posts', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    const result = await query(
      `SELECT 
        p.id, p.title, p.slug, p.excerpt,
        p.featured_image, p.category, p.tags,
        p.published_date, p.status,
        a.name as author_name,
        a.avatar as author_avatar
      FROM posts p
      LEFT JOIN authors a ON p.author_id = a.id
      WHERE p.status = 'published'
      ORDER BY p.published_date DESC
      LIMIT $1`,
      [limit]
    );

    return res.status(200).json({
      success: true,
      posts: result.rows
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch preview posts',
      message: error.message
    });
  }
});
