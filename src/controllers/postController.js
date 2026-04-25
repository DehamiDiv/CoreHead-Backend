const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatPost = async (post) => {
  let author = { name: 'Unknown', avatar: 'U' };
  if (post.author_id) {
    const authorData = await prisma.authors.findUnique({
      where: { id: post.author_id },
      select: { name: true, avatar: true, email: true }
    });
    if (authorData) {
      author = {
        name: authorData.name || authorData.email.split('@')[0],
        avatar: authorData.avatar || (authorData.name ? authorData.name.charAt(0) : authorData.email.charAt(0))
      };
    }
  }
  return { ...post, author };
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
      published_date
    } = req.body;

    if (!title || !slug || !content || !authorId) {
      return res.status(400).json({ error: 'Title, slug, content, and authorId are required.' });
    }

    const post = await prisma.posts.create({
      data: {
        title,
        slug,
        excerpt,
        body: content,
        featured_image: thumbnailUrl,
        status: status || 'Published',
        category: category || 'General',
        tags: tags || [],
        author_id: parseInt(authorId, 10),
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

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const { category, limit, status } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (status)   where.status = status;

    const posts = await prisma.posts.findMany({
      where,
      take: limit ? parseInt(limit, 10) : undefined,
      orderBy: {
        created_at: 'desc'
      }
    });

    const formattedPosts = await Promise.all(posts.map(post => formatPost(post)));
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
    const post = await prisma.posts.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const formattedPost = await formatPost(post);
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

    const post = await prisma.posts.update({
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
    await prisma.posts.delete({
      where: { id: parseInt(id, 10) }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};

