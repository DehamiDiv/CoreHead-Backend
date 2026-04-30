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

  const { author: prismaAuthor, ...postWithoutAuthor } = post;
  return { ...postWithoutAuthor, author };
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
      thumbnailUrl,
      authorId,
      keywords,
      metaTitle,
      metaDescription,
      canonicalUrl,
      structuredData,
      tags,
      isPublished,
      publishedAt,
      category,
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

    // Use logged-in user's ID, or fall back to provided authorId, or default to 1
    const resolvedAuthorId = req.user?.id || parseInt(authorId, 10) || 1;

    // Parse structuredData safely if it's a string
    let finalStructuredData = structuredData;
    if (typeof structuredData === 'object') {
      finalStructuredData = JSON.stringify(structuredData);
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt:         excerpt         || null,
        content,
        coverImage:      thumbnailUrl    || null,
        status:          status          || 'published',
        featured:        featured        ?? false,
        category:        category        || null,
        tags:            tags            || [],
        isPublished:     isPublished     ?? false,
        publishedAt:     publishedAt ? new Date(publishedAt) : null,
        authorId:        resolvedAuthorId,
        keywords:        keywords        || null,
        metaTitle:       metaTitle       || null,
        metaDescription: metaDescription || null,
        canonicalUrl:    canonicalUrl    || null,
        structuredData:  finalStructuredData || null,
      },
      include: {
        author: { select: { id: true, email: true } }
      }
    });

    res.status(201).json({ message: 'Post created successfully', ...post });
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
    const { category, limit, status, featured } = req.query;

    const where = {};
    if (status)   where.status = status;
    if (category) where.category = category;
    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } }
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
        author: { select: { id: true, email: true, name: true, avatar: true } }
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
      tags,
      featured,
      isPublished,
      publishedAt
    } = req.body;

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title        !== undefined && { title }),
        ...(slug         !== undefined && { slug }),
        ...(excerpt      !== undefined && { excerpt }),
        ...(content      !== undefined && { content }),
        ...(status       !== undefined && { status }),
        ...(thumbnailUrl !== undefined && { coverImage: thumbnailUrl }),
        ...(category     !== undefined && { category }),
        ...(tags         !== undefined && { tags }),
        ...(featured     !== undefined && { featured: featured === true || featured === 'true' }),
        ...(isPublished  !== undefined && { isPublished: isPublished === true || isPublished === 'true' }),
        ...(publishedAt  !== undefined && { publishedAt: new Date(publishedAt) }),
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
