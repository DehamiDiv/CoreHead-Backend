const prisma = require('../models/prismaClient');

/**
 * R3-2 Public: approved comments for a published post (no auth).
 * GET /api/comments/public?postId=
 */
exports.getPublicComments = async (req, res) => {
  try {
    const postId = parseInt(req.query.postId, 10);
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        isPublished: true,
        allowComments: true,
        siteId: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const live =
      post.isPublished === true ||
      String(post.status || '').toLowerCase() === 'published';
    if (!live) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.siteId != null && post.siteId != null && Number(post.siteId) !== Number(req.siteId)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: { in: ['approved', 'Approved'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        userName: true,
        userAvatar: true,
        createdAt: true,
        status: true,
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching public comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

/**
 * Admin: list comments for posts belonging to the current site only (T15).
 */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.query;
    const where = {
      post: { siteId: req.siteId },
    };
    if (postId) {
      where.postId = parseInt(postId, 10);
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        post: {
          select: { title: true, slug: true, siteId: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      status: c.status,
      postId: c.postId,
      postTitle: c.post?.title || 'Unknown Post',
      postSlug: c.post?.slug,
      userId: c.userId,
      userName: c.user?.name || c.userName || 'Anonymous',
      userAvatar: c.userAvatar,
      createdAt: c.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

/**
 * Admin: update comment only if its post belongs to current site.
 */
exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, content } = req.body;

    const existing = await prisma.comment.findFirst({
      where: {
        id: parseInt(id, 10),
        post: { siteId: req.siteId },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const data = {};
    if (status !== undefined) data.status = status;
    if (content !== undefined) data.content = content;

    const comment = await prisma.comment.update({
      where: { id: existing.id },
      data,
    });

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

/**
 * Admin: delete comment only if its post belongs to current site.
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.comment.findFirst({
      where: {
        id: parseInt(id, 10),
        post: { siteId: req.siteId },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await prisma.comment.delete({
      where: { id: existing.id },
    });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

/**
 * Public create: only on published posts; optional siteId check via post.siteId.
 */
exports.createComment = async (req, res) => {
  try {
    const { postId, content, userId, userName, userAvatar } = req.body;

    if (!postId || !content || !String(content).trim()) {
      return res.status(400).json({ error: 'postId and content are required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId, 10) },
      select: {
        id: true,
        siteId: true,
        status: true,
        isPublished: true,
        allowComments: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const live =
      post.isPublished === true ||
      String(post.status || '').toLowerCase() === 'published';
    if (!live) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Default allow when null/undefined; only block explicit false
    if (post.allowComments === false) {
      return res.status(403).json({ error: 'Comments are disabled on this post' });
    }

    // If client sent site context, enforce match (T15)
    if (req.siteId != null && post.siteId != null && Number(post.siteId) !== Number(req.siteId)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        postId: post.id,
        userId: userId ? parseInt(userId, 10) : req.user?.id || null,
        userName: userName || req.user?.name || null,
        userAvatar: userAvatar || null,
        status: 'approved',
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
