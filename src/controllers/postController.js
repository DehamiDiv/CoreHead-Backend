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
      authorId
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
        status: status || 'published',
        categories: categories || [],
        featured: featured || false,
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
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format author name (mocking avatar/name based on email if needed, or just sending email)
    const formattedPosts = posts.map(post => ({
      ...post,
      author: {
        name: post.author.email.split('@')[0], // Simple fallback for name
        avatar: post.author.email.split('@')[0], // Seed for avatar
      }
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
};
