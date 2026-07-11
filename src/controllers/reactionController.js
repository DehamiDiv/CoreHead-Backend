const prisma = require('../models/prismaClient');

const ALLOWED = new Set(['like', 'love', 'insightful', 'celebrate']);

const isLivePost = (post) =>
  post.isPublished === true ||
  String(post.status || '').toLowerCase() === 'published';

/**
 * GET /api/reactions/public?postId=
 * Returns counts + optional my reaction when visitorKey query is sent.
 */
exports.getPublicReactions = async (req, res) => {
  try {
    const postId = parseInt(req.query.postId, 10);
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, isPublished: true, siteId: true },
    });
    if (!post || !isLivePost(post)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (
      req.siteId != null &&
      post.siteId != null &&
      Number(post.siteId) !== Number(req.siteId)
    ) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const rows = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    });

    const counts = { like: 0, love: 0, insightful: 0, celebrate: 0, total: 0 };
    for (const row of rows) {
      const t = String(row.type || '').toLowerCase();
      if (counts[t] !== undefined) {
        counts[t] = row._count._all;
        counts.total += row._count._all;
      }
    }

    let mine = null;
    const visitorKey = String(req.query.visitorKey || '').trim();
    if (visitorKey) {
      const existing = await prisma.postReaction.findUnique({
        where: {
          postId_visitorKey: { postId, visitorKey },
        },
      });
      if (existing) mine = existing.type;
    }

    res.json({ success: true, postId, counts, mine });
  } catch (error) {
    console.error('getPublicReactions:', error);
    res.status(500).json({ error: 'Failed to load reactions' });
  }
};

/**
 * POST /api/reactions
 * body: { postId, type, visitorKey }
 * One reaction per visitor per post (updates if already set).
 */
exports.reactToPost = async (req, res) => {
  try {
    const postId = parseInt(req.body.postId, 10);
    const type = String(req.body.type || '').toLowerCase().trim();
    const visitorKey = String(req.body.visitorKey || '').trim().slice(0, 64);

    if (!postId || !type || !visitorKey) {
      return res.status(400).json({
        error: 'postId, type, and visitorKey are required',
      });
    }
    if (!ALLOWED.has(type)) {
      return res.status(400).json({
        error: 'type must be like, love, insightful, or celebrate',
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, isPublished: true, siteId: true },
    });
    if (!post || !isLivePost(post)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (
      req.siteId != null &&
      post.siteId != null &&
      Number(post.siteId) !== Number(req.siteId)
    ) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reaction = await prisma.postReaction.upsert({
      where: {
        postId_visitorKey: { postId, visitorKey },
      },
      create: { postId, type, visitorKey },
      update: { type },
    });

    const rows = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    });
    const counts = { like: 0, love: 0, insightful: 0, celebrate: 0, total: 0 };
    for (const row of rows) {
      const t = String(row.type || '').toLowerCase();
      if (counts[t] !== undefined) {
        counts[t] = row._count._all;
        counts.total += row._count._all;
      }
    }

    res.status(200).json({
      success: true,
      reaction: { type: reaction.type },
      mine: reaction.type,
      counts,
    });
  } catch (error) {
    console.error('reactToPost:', error);
    res.status(500).json({ error: 'Failed to save reaction' });
  }
};

/**
 * DELETE /api/reactions
 * body: { postId, visitorKey } — remove my reaction
 */
exports.removeReaction = async (req, res) => {
  try {
    const postId = parseInt(req.body.postId || req.query.postId, 10);
    const visitorKey = String(
      req.body.visitorKey || req.query.visitorKey || '',
    )
      .trim()
      .slice(0, 64);

    if (!postId || !visitorKey) {
      return res.status(400).json({ error: 'postId and visitorKey required' });
    }

    await prisma.postReaction.deleteMany({
      where: { postId, visitorKey },
    });

    const rows = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    });
    const counts = { like: 0, love: 0, insightful: 0, celebrate: 0, total: 0 };
    for (const row of rows) {
      const t = String(row.type || '').toLowerCase();
      if (counts[t] !== undefined) {
        counts[t] = row._count._all;
        counts.total += row._count._all;
      }
    }

    res.json({ success: true, mine: null, counts });
  } catch (error) {
    console.error('removeReaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};
