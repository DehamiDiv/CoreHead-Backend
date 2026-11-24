const prisma = require('../models/prismaClient');

/**
 * Public endpoint: record a single post view and increment Post.views.
 */
const trackPostView = async (req, res) => {
  try {
    const postId = parseInt(req.body?.postId, 10);
    if (!postId || Number.isNaN(postId)) {
      return res.status(400).json({ error: 'Valid postId is required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, siteId: true },
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const referrer = req.body?.referrer ? String(req.body.referrer).slice(0, 500) : null;

    await prisma.$transaction([
      prisma.postView.create({
        data: {
          postId: post.id,
          siteId: post.siteId,
          referrer,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      }),
    ]);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Track post view error:', error);
    res.status(500).json({ error: 'Failed to track post view' });
  }
};

/**
 * Admin endpoint: return site-scoped traffic overview, daily views chart data, and top posts.
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
    const siteId = req.siteId;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      postStats,
      publishedCount,
      todayViewsCount,
      recentViews,
      topPosts,
      subscriberCount,
    ] = await Promise.all([
      prisma.post.aggregate({
        where: { siteId },
        _sum: { views: true },
        _count: { id: true },
      }),
      prisma.post.count({
        where: { siteId, status: 'published' },
      }),
      prisma.postView.count({
        where: { siteId, viewedAt: { gte: todayStart } },
      }),
      prisma.postView.findMany({
        where: { siteId, viewedAt: { gte: startDate } },
        select: { viewedAt: true },
      }),
      prisma.post.findMany({
        where: { siteId },
        orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          views: true,
          publishedAt: true,
        },
      }),
      prisma.newsletterSubscription.count({
        where: {
          OR: [{ siteId }, { siteId: null }],
          status: 'active',
        },
      }),
    ]);

    // Build continuous daily views array
    const dailyMap = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      dailyMap.set(iso, 0);
    }

    recentViews.forEach((v) => {
      const iso = new Date(v.viewedAt).toISOString().slice(0, 10);
      if (dailyMap.has(iso)) {
        dailyMap.set(iso, dailyMap.get(iso) + 1);
      }
    });

    const dailyViews = Array.from(dailyMap.entries()).map(([date, views]) => {
      const dt = new Date(`${date}T00:00:00Z`);
      const label = dt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      return { date, label, views };
    });

    res.json({
      summary: {
        totalViews: postStats._sum.views || 0,
        todayViews: todayViewsCount,
        totalPosts: postStats._count.id || 0,
        publishedPosts: publishedCount,
        totalSubscribers: subscriberCount,
      },
      dailyViews,
      topPosts,
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Failed to load analytics overview' });
  }
};

module.exports = {
  trackPostView,
  getAnalyticsOverview,
};
