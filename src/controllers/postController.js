const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };
  
  if (post.authors) {
    author = {
      name: post.authors.name || post.authors.email.split('@')[0],
      avatar: post.authors.avatar || (post.authors.name ? post.authors.name.charAt(0) : post.authors.email.charAt(0))
    };
  }
  
  const { authors, ...postWithoutAuthors } = post;
  return { ...postWithoutAuthors, author };
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
      category,
      tags,
      thumbnailUrl,
      published_date
    } = req.body;

    const authorId = req.user.id; // Use ID from token

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        body: content,
        featured_image: thumbnailUrl,
        status: status || 'Published',
        category: category || 'General',
        tags: tags || [],
        author_id: authorId,
        published_date: published_date ? new Date(published_date) : new Date(),
      },
    });

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A post with this URL slug already exists.' });
    }
    res.status(500).json({ error: 'Failed to create post.' });
  }
};

// Get all posts (filtered by user unless admin)
exports.getPosts = async (req, res) => {
  try {
    const { category, limit, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const where = {};
    if (category) where.category = category;
    if (status)   where.status = status;

    // Filter by user unless admin
    if (userRole !== 'admin') {
      where.author_id = userId;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        authors: {
          select: { name: true, avatar: true, email: true }
        }
      },
      take: limit ? parseInt(limit, 10) : undefined,
      orderBy: {
        created_at: 'desc'
      }
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        authors: {
          select: { name: true, avatar: true, email: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Ownership check
    if (userRole !== 'admin' && post.author_id !== userId) {
      return res.status(403).json({ error: 'Access denied. This post does not belong to you.' });
    }

    const formattedPost = formatPostData(post);
    res.status(200).json(formattedPost);
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
      category,
      tags,
      thumbnailUrl,
      published_date
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check existence and ownership first
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });

    if (userRole !== 'admin' && existingPost.author_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own posts.' });
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        slug,
        excerpt,
        body: content,
        featured_image: thumbnailUrl,
        status,
        category,
        tags,
        published_date: published_date ? new Date(published_date) : undefined,
        updated_at: new Date()
      },
    });

    res.status(200).json({ message: 'Post updated successfully', post });
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });

    if (userRole !== 'admin' && existingPost.author_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await prisma.post.delete({
      where: { id: parseInt(id, 10) }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};
