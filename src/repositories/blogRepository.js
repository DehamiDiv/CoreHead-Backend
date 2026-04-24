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
      status: "Published",
    },
    select: {
      id:         true,
      slug:       true,
      title:      true,
      excerpt:    true,
      coverImage: true,
      author:     true,
      categories: true,
      createdAt:  true,
    },
    orderBy: { createdAt: 'desc' },
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
      status: "Published",
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
      status: "Published",
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

module.exports = {
  getPreviewPosts,
  countPublishedPosts,
  getPostBySlug,
  getPublicLayout,
  upsertLayout,
};