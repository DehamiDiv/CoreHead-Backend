const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');
const aiService = require('../services/aiService');
const rateLimit = require('express-rate-limit');

// Rate limiter for AI endpoints (10 requests per 15 minutes)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── POST /api/ai/generate-layout ─────────────────────────────
// Takes a user prompt and returns an array of BuilderBlocks
router.post('/generate-layout', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'Invalid prompt. Please enter at least 5 characters.' });
    }

    if (prompt.length > 500) {
      return res.status(400).json({ error: 'Prompt too long (max 500 characters allowed).' });
    }

    // Edge case handle: stop XSS / script tags
    if (prompt.toLowerCase().includes('<script>') || prompt.toLowerCase().includes('</script>')) {
      return res.status(400).json({ error: 'Invalid prompt content. Script tags are not allowed.' });
    }

    const sanitizedPrompt = prompt.trim();
    let blocks;
    let isFallback = false;

    try {
      // Use the service created as part of Member 04 contribution
      const result = await aiService.generateLayout(sanitizedPrompt);
      blocks = result.blocks;
      isFallback = result.isFallback;
    } catch (err) {
      if (err.message === 'AI_INIT_FAILED') {
        return res.status(503).json({ error: 'AI Service currently unavailable (Initialization Error).' });
      }
      if (err.message === 'AI_TIMEOUT') {
        return res.status(504).json({ error: 'AI request timed out. Please try again.' });
      }
      console.error('[Route Error]', err.message);
      throw err;
    }

    // Save to DB for history
    let saved;
    try {
      saved = await prisma.ai_layouts.create({
        data: {
          user_id: req.user.id,
          prompt,
          layout_type: 'blog-archive',
          design_style: 'modern',
          features: {},
          generated_layout: { blocks },
        },
      });
    } catch (dbErr) {
      console.warn('AI layout DB save failed:', dbErr.message);
    }

    return res.json({ 
      success: true, 
      blocks,
      id: saved ? saved.id : null,
      isFallback
    });

  } catch (error) {
    console.error('AI generate-layout error:', error);
    return res.status(500).json({
      error: 'Failed to generate layout.',
      message: error.message,
    });
  }
});

// ─── GET /api/ai/history ──────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const layouts = await prisma.ai_layouts.findMany({
      where: { user_id: req.user.id },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    return res.json({ success: true, layouts });
  } catch (error) {
    console.error('Error fetching AI history:', error);
    return res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

module.exports = router;
