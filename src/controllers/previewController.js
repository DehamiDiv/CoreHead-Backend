const prisma = require('../models/prismaClient');
const {
  isPublicPost,
  publicPostWhere,
} = require('../contracts/postPublication');

/**
 * Preview posts for a single site only (T15).
 * Requires siteId query or X-Site-Id — no global cross-tenant listing.
 */
const getPreviewPosts = async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10) || 3;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const rawSiteId = req.headers['x-site-id'] || req.query.siteId;
    const siteId = rawSiteId ? parseInt(String(rawSiteId), 10) : null;

    if (!siteId || !Number.isFinite(siteId)) {
      return res.status(400).json({
        error: 'siteId is required (X-Site-Id header or ?siteId=).',
        posts: [],
      });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site || (site.status && String(site.status).toLowerCase() !== 'active')) {
      return res.status(404).json({ error: 'Site not found.', posts: [] });
    }

    const posts = await prisma.post.findMany({
      where: publicPostWhere(siteId),
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        status: true,
        isPublished: true,
        siteId: true,
        createdAt: true,
        author: { select: { email: true, name: true, avatar: true } },
      },
    });

    const mapped = posts.filter(isPublicPost).map((p) => ({
      ...p,
      thumbnailUrl: p.coverImage || null,
      featured_image: p.coverImage || null,
      published_date: p.createdAt,
      author_name: p.author?.name || p.author?.email || null,
      author_avatar: p.author?.avatar || null,
      imageUrl: p.coverImage || "https://via.placeholder.com/400x250",
    }));

    // No mock posts that could look like real multi-tenant content
    return res.status(200).json({ success: true, posts: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPreviewPosts,
};
