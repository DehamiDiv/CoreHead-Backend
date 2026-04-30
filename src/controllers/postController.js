const prisma = require('../models/prismaClient');

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };

  if (post.author) {
    const name = post.author.name || post.author.email?.split('@')[0] || 'Unknown';
    author = {
      id: post.author.id,
      name,
      email: post.author.email,
      avatar: post.author.avatar || name.charAt(0).toUpperCase()
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
      featured,
      categories,
      category,
      tags,
      thumbnailUrl,
      authorId,
      keywords,
      metaTitle,
      metaDescription,
      canonicalUrl,
      structuredData,
      published_date
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

    // Use logged-in user's ID, or fall back to provided authorId, or default to 1
    const resolvedAuthorId = req.user?.id || parseInt(authorId, 10) || 1;

    // Handle category
    const finalCategory = category || (Array.isArray(categories) && categories.length > 0 ? categories[0] : 'General');

    // Serialize arrays to comma-separated strings (schema stores as String?)
    const categoriesStr = Array.isArray(categories)
      ? categories.join(',')
      : (typeof categories === 'string' ? categories : '');

    const keywordsStr = Array.isArray(keywords)
      ? keywords.join(',')
      : (typeof keywords === 'string' ? keywords : '');

    // Parse structuredData safely
    let parsedStructuredData = null;
    if (structuredData) {
      try {
        parsedStructuredData = typeof structuredData === 'string'
          ? JSON.parse(structuredData)
          : JSON.stringify(structuredData);
      } catch (_) {
        parsedStructuredData = String(structuredData);
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt:         excerpt         || null,
        content,
        coverImage:      thumbnailUrl    || null,
        status:          status          || 'published',
        featured:        featured === true || featured === 'true',
        category:        finalCategory,
        categories:      categoriesStr   || null,
        tags:            tags            || [],
        keywords:        keywordsStr     || null,
        metaTitle:       metaTitle       || null,
        metaDescription: metaDescription || null,
        canonicalUrl:    canonicalUrl    || null,
        structuredData:  parsedStructuredData,
        authorId:        resolvedAuthorId,
        publishedAt:     published_date ? new Date(published_date) : new Date(),
      },
      include: {
        author: { select: { id: true, email: true, name: true } }
      }
    });

    res.status(201).json({ message: 'Post created successfully', ...formatPostData(post) });
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
    const { category, limit, status } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (status)   where.status = status;
    if (req.query.featured !== undefined) {
      where.featured = req.query.featured === 'true';
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, email: true, name: true }
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
        author: { select: { id: true, email: true, name: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json(formatPostData(post));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post.', message: error.message });
  }
};

// Get single post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, email: true, name: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json(formatPostData(post));
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    res.status(500).json({ error: 'Failed to fetch post.', message: error.message });
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
      category,
      categories,
      tags,
      featured,
      published_date
    } = req.body;

    const finalCategory = category || (Array.isArray(categories) && categories.length > 0 ? categories[0] : undefined);

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title        !== undefined && { title }),
        ...(slug         !== undefined && { slug }),
        ...(excerpt      !== undefined && { excerpt }),
        ...(content      !== undefined && { content }),
        ...(status       !== undefined && { status }),
        ...(thumbnailUrl !== undefined && { coverImage: thumbnailUrl }),
        ...(finalCategory !== undefined && { category: finalCategory }),
        ...(tags         !== undefined && { tags }),
        ...(featured     !== undefined && { featured: featured === true || featured === 'true' }),
        ...(published_date !== undefined && { publishedAt: new Date(published_date) }),
      },
      include: {
        author: { select: { id: true, email: true, name: true } }
      }
    });

    res.status(200).json({ message: 'Post updated successfully', post: formatPostData(post) });
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A post with this URL slug already exists.' });
    }
    res.status(500).json({ error: 'Failed to update post.', message: error.message });
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
    res.status(500).json({ error: 'Failed to delete post.', message: error.message });
  }
};
