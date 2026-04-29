const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };
  
  if (post.author) {
    author = {
      name: post.author.name || post.author.email.split('@')[0],
      avatar: post.author.avatar || post.author.email.charAt(0).toUpperCase()
    };
  }
  
  // Remove the internal 'author' object from Prisma and replace with formatted 'author'
  const { author: prismaAuthor, ...postWithoutAuthor } = post;
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
      category,
      tags,
      authorId,
      thumbnailUrl,
      published_date,
      categories // Added categories from frontend
    } = req.body;

    if (!title || !slug || !content || !authorId) {
      return res.status(400).json({ error: 'Title, slug, content, and authorId are required.' });
    }

    // Handle category: take the first one from categories array if category is not provided
    const finalCategory = category || (categories && categories.length > 0 ? categories[0] : 'General');

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        imageUrl: thumbnailUrl,
        status: status || 'Published',
        category: finalCategory,
        tags: tags || [],
        authorId: parseInt(authorId, 10),
        published_date: published_date ? new Date(published_date) : new Date(),
      },
    });

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A post with this URL slug already exists.' });
    }
    res.status(500).json({ error: 'Failed to create post.', details: error.message || String(error) });
  }
};

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const { category, limit, status } = req.query;
    
    const where = {};
    // Security Note: Using Prisma's object-based 'where' clause is safe from SQL injection 
    // as it uses parameterized queries under the hood.
    if (category) where.category = category;
    if (status)   where.status = status;

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: { email: true, name: true, avatar: true }
        }
      },
      take: limit ? parseInt(limit, 10) : undefined,
      orderBy: {
        createdAt: 'desc'
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
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        author: {
          select: { email: true, name: true, avatar: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
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
      published_date,
      categories
    } = req.body;

    const finalCategory = category || (categories && categories.length > 0 ? categories[0] : undefined);

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        slug,
        excerpt,
        content,
        imageUrl: thumbnailUrl,
        status,
        category: finalCategory,
        tags,
        published_date: published_date ? new Date(published_date) : undefined,
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
    await prisma.post.delete({
      where: { id: parseInt(id, 10) }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};

