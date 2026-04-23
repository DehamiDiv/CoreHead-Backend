// src/controllers/blogController.js
const blogService = require('../services/blogService');

// ─── Layout ───────────────────────────────────────────────────

/**
 * GET /api/blog/layout/:slug
 * Returns the CMS page layout for a given slug (e.g. 'blog-loop').
 */
const getPublicLayout = async (req, res) => {
  try {
    const layout = await blogService.getPublicLayout(req.params.slug);
    return res.status(200).json(layout);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch layout' });
  }
};

// ─── Posts ────────────────────────────────────────────────────

/**
 * GET /api/blog/posts/preview?limit=6&offset=0
 * Returns paginated preview posts for the archive loop.
 */
const getPreviewPosts = async (req, res) => {
  try {
    const { limit = 6, offset = 0 } = req.query;
    const result = await blogService.getPreviewPosts(limit, offset);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch posts' });
  }
};

/**
 * GET /api/blog/posts/:slug
 * Returns a single published post by slug.
 */
const getPostBySlug = async (req, res) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug);
    return res.status(200).json(post);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch post' });
  }
};

module.exports = {
  getPublicLayout,
  getPreviewPosts,
  getPostBySlug,
};