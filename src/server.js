require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Routes ──
const authRoutes     = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const previewRoutes  = require('./routes/previewRoutes');
const postRoutes     = require('./routes/postRoutes');
const bindingRoutes  = require('./routes/bindingRoutes');
const aiRoutes       = require('./routes/aiRoutes');
const blogRoutes     = require('./routes/blogRoutes');
const builderRoutes  = require('./routes/builderRoutes');
const userRoutes     = require('./routes/userRoutes');
const pageRoutes     = require('./routes/pageRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const mediaRoutes    = require('./routes/mediaRoutes');
const commentRoutes  = require('./routes/commentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Health Check ──
app.get('/', (req, res) => {
  res.send('Corehead Backend Server is Running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ── Preview Posts — called by friend's frontend ──
app.get('/api/preview/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

<<<<<<< HEAD
    // ✅ Uses Prisma with correct model name 'posts'
=======
    // ✅ Uses the 'Post' model (maps to Post table via User relation)
>>>>>>> auth-complete
    const posts = await prisma.post.findMany({
      take: limit,
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      select: {
        id:         true,
        title:      true,
        slug:       true,
        excerpt:    true,
        coverImage: true,
        status:     true,
        createdAt: true,
        author: {
          select: { id: true, email: true }
        }
      }
    });

    const postsWithAuthor = posts.map((post) => ({
      ...post,
      featured_image: post.coverImage,
      published_date: post.createdAt,
      author_name:    post.author?.email || null,
      author_avatar:  null,
      category:       null,
      tags:           [],
    }));

    return res.status(200).json({
      success: true,
      posts: postsWithAuthor
    });

  } catch (error) {
    console.error('Preview posts error:', error);
    return res.status(500).json({
      error: 'Failed to fetch preview posts',
      message: error.message
    });
  }
});

// ── Bindings — called by friend's frontend ──
app.get('/api/bindings', (req, res) => {
  res.json({
    mode: 'dynamic',
    selected: {}
  });
});

// ── API Routes ──
app.use('/api/auth',      authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/preview',   previewRoutes);
app.get('/api/posts_diag', (req, res) => res.json({ msg: 'Diag from server.js' }));
app.use('/api/posts',     postRoutes);
app.use('/api/builder',   builderRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api',           bindingRoutes);
app.use('/api/blog',      blogRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/pages',     pageRoutes);
app.use('/api/categories',categoryRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/media',     mediaRoutes);
app.use('/api/comments',  commentRoutes);

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT} `);
});