const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      categories,
      featured,
      authorId,
      thumbnailUrl, // mapped to coverImage
      metaTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      structuredData
    } = req.body;

    // Validate required fields
    if (!title || !slug || !content || !authorId) {
      return res.status(400).json({ error: 'Title, slug, content, and authorId are required.' });
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage: thumbnailUrl,
        status: status || 'Published',
        categories: categories || [],
        featured: featured || false,
        metaTitle,
        metaDescription,
        keywords: keywords || [],
        canonicalUrl,
        structuredData,
        authorId: parseInt(authorId, 10),
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
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      author: {
        name: post.author.name || post.author.email.split('@')[0],
        avatar: post.author.name ? post.author.name.charAt(0) : post.author.email.charAt(0),
      }
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
};

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json(post);
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
      categories,
      featured,
      thumbnailUrl,
      metaTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      structuredData
    } = req.body;

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage: thumbnailUrl,
        status,
        categories,
        featured,
        metaTitle,
        metaDescription,
        keywords,
        canonicalUrl,
        structuredData
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
