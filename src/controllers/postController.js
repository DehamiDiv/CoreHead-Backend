const prisma = require('../models/prismaClient');

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };
<<<<<<< HEAD
  
  if (post.author) {
    author = {
      name: post.author.name || post.author.email.split('@')[0],
      avatar: post.author.avatar || post.author.email.charAt(0).toUpperCase()
    };
  }
  
  // Remove the internal 'author' object from Prisma and replace with formatted 'author'
  const { author: prismaAuthor, ...postWithoutAuthor } = post;
=======

  if (post.author) {
    const name = post.author.name || post.author.email?.split('@')[0] || 'Unknown';
    author = {
      id: post.author.id,
      name,
      email: post.author.email,
      avatar: name.charAt(0).toUpperCase()
    };
  }

  const { author: rawAuthor, ...postWithoutAuthor } = post;
>>>>>>> auth-complete
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
<<<<<<< HEAD
      published_date,
      categories,
      featured 
=======
      authorId,
      keywords,
      metaTitle,
      metaDescription,
      canonicalUrl,
      structuredData,
>>>>>>> auth-complete
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

<<<<<<< HEAD
    // Handle category: take the first one from categories array if category is not provided
    const finalCategory = category || (categories && categories.length > 0 ? categories[0] : 'General');
=======
    // Use logged-in user's ID, or fall back to provided authorId, or default to 1
    const resolvedAuthorId = req.user?.id || parseInt(authorId, 10) || 1;

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
          : structuredData;
      } catch (_) {
        parsedStructuredData = null;
      }
    }
>>>>>>> auth-complete

    const post = await prisma.post.create({
      data: {
        title,
        slug,
<<<<<<< HEAD
        excerpt,
        content,
        imageUrl: thumbnailUrl,
        status: status || 'Published',
        category: finalCategory,
        tags: tags || [],
        featured: featured === true || featured === 'true',
        authorId: parseInt(authorId, 10),
        published_date: published_date ? new Date(published_date) : new Date(),
=======
        excerpt:         excerpt         || null,
        content,
        coverImage:      thumbnailUrl    || null,   // ✅ schema field is coverImage
        status:          status          || 'published',
        featured:        featured        ?? false,
        categories:      categoriesStr   || null,
        keywords:        keywordsStr     || null,
        metaTitle:       metaTitle       || null,
        metaDescription: metaDescription || null,
        canonicalUrl:    canonicalUrl    || null,
        structuredData:  parsedStructuredData,
        authorId:        resolvedAuthorId,
>>>>>>> auth-complete
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
<<<<<<< HEAD
    res.status(500).json({ error: 'Failed to create post.', details: error.message || String(error) });
=======
    res.status(500).json({ error: 'Failed to create post.', message: error.message });
>>>>>>> auth-complete
  }
};

// Get all posts
exports.getPosts = async (req, res) => {
  try {
<<<<<<< HEAD
    const { category, limit, status } = req.query;
    
    const where = {};
    // Security Note: Using Prisma's object-based 'where' clause is safe from SQL injection 
    // as it uses parameterized queries under the hood.
    if (category) where.category = category;
    if (status)   where.status = status;
    if (req.query.featured !== undefined) {
      where.featured = req.query.featured === 'true';
    }

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
=======
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
>>>>>>> auth-complete
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
<<<<<<< HEAD
        author: {
          select: { email: true, name: true, avatar: true }
        }
=======
        author: { select: { id: true, email: true } }
>>>>>>> auth-complete
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
<<<<<<< HEAD
      published_date,
      categories,
      featured
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
        featured: featured !== undefined ? (featured === true || featured === 'true') : undefined,
        published_date: published_date ? new Date(published_date) : undefined,
=======
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
>>>>>>> auth-complete
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
