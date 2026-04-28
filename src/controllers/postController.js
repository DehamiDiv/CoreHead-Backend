const prisma = require('../models/prismaClient');

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };

  if (post.author) {
    const name = post.author.email?.split('@')[0] || 'Unknown';
    author = {
      name,
      avatar: name.charAt(0).toUpperCase()
    };
  }

  const { author: rawAuthor, ...postWithoutAuthor } = post;
  return { ...postWithoutAuthor, author };
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      categories,   // frontend sends categories[] array
      thumbnailUrl,
      authorId,
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

    // Use logged-in user's ID, or fall back to provided authorId, or default to 1
    const resolvedAuthorId = req.user?.id || parseInt(authorId, 10) || 1;

    // Pick first category from array (Post model has no array support)
    const category = Array.isArray(categories) && categories.length > 0
      ? categories[0]
      : (typeof categories === 'string' ? categories : 'General');

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt:  excerpt || null,
        content,
        imageUrl: thumbnailUrl || null,
        status:   status || 'published',
        authorId: resolvedAuthorId,
      },
      include: {
        author: { select: { id: true, email: true } }
      }
    });

    res.status(201).json({ message: 'Post created successfully', post: formatPostData(post) });
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A post with this URL slug already exists.' });
    }
    res.status(500).json({ error: 'Failed to create post.', message: error.message });
  }
};

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const { limit, status } = req.query;

    const where = {};
    if (status) where.status = status;

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, email: true } }
      },
      take:     limit ? parseInt(limit, 10) : undefined,
      orderBy:  { createdAt: 'desc' }
    });

    const formattedPosts = posts.map(post => formatPostData(post));
    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.', message: error.message });
  }
};

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        author: { select: { id: true, email: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json(formatPostData(post));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      thumbnailUrl,
    } = req.body;

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title        !== undefined && { title }),
        ...(slug         !== undefined && { slug }),
        ...(excerpt      !== undefined && { excerpt }),
        ...(content      !== undefined && { content }),
        ...(status       !== undefined && { status }),
        ...(thumbnailUrl !== undefined && { imageUrl: thumbnailUrl }),
      },
      include: {
        author: { select: { id: true, email: true } }
      }
    });

    res.status(200).json({ message: 'Post updated successfully', post: formatPostData(post) });
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A post with this URL slug already exists.' });
    }
    res.status(500).json({ error: 'Failed to update post.' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({
      where: { id: parseInt(id, 10) }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};
