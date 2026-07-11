const prisma = require('../models/prismaClient');

/**
 * Preview posts for a single site only (T15).
 * Requires siteId query or X-Site-Id — no global cross-tenant listing.
 */
const getPreviewPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
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
      where: {
        siteId,
        OR: [
          { status: { in: ['Published', 'published'] } },
          { isPublished: true },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        status: true,
        siteId: true,
        createdAt: true,
        author: { select: { email: true, name: true, avatar: true } },
      },
    });

    const mapped = posts.map((p) => ({
      ...p,
      thumbnailUrl: p.coverImage || null,
    }));

    // No mock posts that could look like real multi-tenant content
    return res.status(200).json({ posts: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPreviewPosts,
};
