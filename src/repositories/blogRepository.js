// src/repositories/blogRepository.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Posts ────────────────────────────────────────────────────

/**
 * Fetch published preview posts (for archive loop).
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Array>}
 */
const getPreviewPosts = async (limit = 6, offset = 0) => {
  return await prisma.post.findMany({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
    },
    select: {
      id:         true,
      slug:       true,
      title:      true,
      excerpt:    true,
      coverImage: true,
      author:     true,
      category:   true,
      tags:       true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
    take:    limit,
    skip:    offset,
  });
};

/**
 * Count all published posts (for pagination meta).
 * @returns {Promise<number>}
 */
const countPublishedPosts = async () => {
  return await prisma.post.count({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
    },
  });
};

/**
 * Fetch a single published post by slug.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
const getPostBySlug = async (slug) => {
  return await prisma.post.findFirst({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  });
};

// ─── Page Layouts ─────────────────────────────────────────────

/**
 * Fetch an active CMS layout by slug.
 * @param {string} slug  e.g. 'blog-loop'
 * @returns {Promise<Object|null>}
 */
const getPublicLayout = async (slug) => {
  return await prisma.pageLayout.findFirst({
    where: {
      slug,
      isActive: true,
    },
    select: {
      slug:   true,
      name:   true,
      layout: true,
    },
  });
};

/**
 * Upsert a page layout (used by admin/seed).
 * @param {string} slug
 * @param {string} name
 * @param {Object} layout
 * @returns {Promise<Object>}
 */
const upsertLayout = async (slug, name, layout) => {
  return await prisma.pageLayout.upsert({
    where:  { slug },
    update: { name, layout },
    create: { slug, name, layout },
  });
};

/**
 * Create a new blog post.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createPost = async (data) => {
  return await prisma.post.create({
    data: {
      title:       data.title,
      slug:        data.slug,
      excerpt:     data.excerpt,
      content:     data.content,
      coverImage:  data.thumbnailUrl, // Mapping thumbnailUrl from frontend to coverImage in DB
      category:    Array.isArray(data.categories) ? data.categories[0] : data.categories, // Map first category or string
      status:      data.status.toLowerCase(),
      isPublished: data.status === 'Published',
      publishedAt: data.status === 'Published' ? new Date() : null,
      authorId:    parseInt(data.authorId) || 1,
    }
  });
};

module.exports = {
  getPreviewPosts,
  countPublishedPosts,
  getPostBySlug,
  getPublicLayout,
  upsertLayout,
  createPost,
};