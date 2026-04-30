const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all comments with post details
exports.getComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        post: {
          select: { title: true, slug: true }
        },
        user: {
          select: { name: true, avatar: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Format response to match frontend expectations
    const formatted = comments.map(c => ({
      id: c.id,
      content: c.content,
      status: c.status,
      postId: c.postId,
      postTitle: c.post?.title || 'Unknown Post',
      postSlug: c.post?.slug,
      userId: c.userId,
      userName: c.user?.name || c.userName || 'Anonymous',
      userAvatar: c.user?.avatar || c.userAvatar,
      createdAt: c.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Update comment status (approve, spam, etc)
exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, content } = req.body;
    
    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { 
        status: status,
        content: content // Allow editing the comment text too
      }
    });
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Create a comment (Public/Admin)
exports.createComment = async (req, res) => {
  try {
    const { postId, content, userId, userName, userAvatar } = req.body;
    
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(postId),
        userId: userId ? parseInt(userId) : null,
        userName,
        userAvatar,
        status: 'approved' // Default to approved for now, or use 'pending'
      }
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
