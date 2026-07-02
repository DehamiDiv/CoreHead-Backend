// src/services/blogService.js
const blogRepository = require('../repositories/blogRepository');

// ─── Posts ────────────────────────────────────────────────────

/**
 * Get paginated preview posts for the archive page.
 * Returns posts + pagination meta.
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ posts: Array, meta: Object }>}
 */
const getPreviewPosts = async (limit = 6, offset = 0) => {
  const safeLimit  = Math.min(Math.max(parseInt(limit),  1), 50);
  const safeOffset = Math.max(parseInt(offset), 0);

  const [posts, total] = await Promise.all([
    blogRepository.getPreviewPosts(safeLimit, safeOffset),
    blogRepository.countPublishedPosts(),
  ]);

  return {
    posts,
    meta: {
      total,
      limit:   safeLimit,
      offset:  safeOffset,
      hasMore: safeOffset + safeLimit < total,
    },
  };
};

/**
 * Get a single published post by slug.
 * Throws a 404-style error if not found.
 * @param {string} slug
 * @returns {Promise<Object>}
 */
const getPostBySlug = async (slug) => {
  if (!slug || typeof slug !== 'string') {
    const err = new Error('Invalid slug');
    err.statusCode = 400;
    throw err;
  }

  const post = await blogRepository.getPostBySlug(slug.trim());

  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  return post;
};

// ─── Layouts ─────────────────────────────────────────────────

/**
 * Get a public CMS layout by slug.
 * Throws a 404-style error if not found.
 * @param {string} slug  e.g. 'blog-loop'
 * @returns {Promise<Object>}
 */
const getPublicLayout = async (slug) => {
  if (!slug || typeof slug !== 'string') {
    const err = new Error('Invalid layout slug');
    err.statusCode = 400;
    throw err;
  }

  const layout = await blogRepository.getPublicLayout(slug.trim());

  if (!layout) {
    const err = new Error(`Layout '${slug}' not found`);
    err.statusCode = 404;
    throw err;
  }

  return layout;
};

/**
 * Create a new blog post.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createPost = async (data) => {
  if (!data.title || !data.content || !data.slug) {
    const err = new Error('Title, content, and slug are required');
    err.statusCode = 400;
    throw err;
  }
  return await blogRepository.createPost(data);
};

module.exports = {
  getPreviewPosts,
  getPostBySlug,
  getPublicLayout,
  createPost,
};