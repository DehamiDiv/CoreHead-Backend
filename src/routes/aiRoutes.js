const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');
const creditGuard = require('../middlewares/creditGuard');
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
router.post('/generate-layout', authMiddleware, creditGuard, aiLimiter, async (req, res) => {
  try {
    const { prompt, layoutType, designStyle, features } = req.body;

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
          layout_type: layoutType || 'blog-archive',
          design_style: designStyle || 'modern',
          features: features || {},
          generated_layout: { blocks },
        },
      });
    } catch (dbErr) {
      console.warn('AI layout DB save failed:', dbErr.message);
    }

    // Increment credit usage for FREE users
    if (req.dbUser) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { ai_credits_used: { increment: 1 } }
        });
      } catch (incErr) {
        console.error('Failed to increment user AI credits usage:', incErr.message);
      }
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

// ─── DELETE /api/ai/history/:id ───────────────────────────────
router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const layout = await prisma.ai_layouts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!layout) {
      return res.status(404).json({ error: 'History not found' });
    }

    if (layout.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.ai_layouts.delete({
      where: { id: parseInt(id) }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI history:', error);
    return res.status(500).json({ error: 'Failed to delete AI history' });
  }
});

// ─── PUT /api/ai/history/:id ──────────────────────────────────
router.put('/history/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long.' });
    }

    const layout = await prisma.ai_layouts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!layout) {
      return res.status(404).json({ error: 'History not found' });
    }

    if (layout.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.ai_layouts.update({
      where: { id: parseInt(id) },
      data: { prompt: prompt.trim() }
    });

    return res.json({ success: true, layout: updated });
  } catch (error) {
    console.error('Error updating AI history:', error);
    return res.status(500).json({ error: 'Failed to update AI history' });
  }
});

// ─── POST /api/ai/generate-blog ──────────────────────────────
router.post('/generate-blog', authMiddleware, creditGuard, aiLimiter, async (req, res) => {
  try {
    const { topic, tone, keywords, wordCount } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
      return res.status(400).json({ error: 'Invalid topic. Please describe your topic in at least 5 characters.' });
    }

    if (topic.length > 500) {
      return res.status(400).json({ error: 'Topic too long (max 500 characters allowed).' });
    }

    const result = await aiService.generateBlogContent({ topic, tone, keywords, wordCount });

    // Increment credit usage for FREE users
    if (req.dbUser) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { ai_credits_used: { increment: 1 } }
        });
      } catch (incErr) {
        console.error('Failed to increment user AI credits usage:', incErr.message);
      }
    }

    return res.json(result);

  } catch (error) {
    console.error('AI generate-blog error:', error);
    return res.status(500).json({
      error: 'Failed to generate blog content.',
      message: error.message,
    });
  }
});

// ─── POST /api/ai/modify-layout ──────────────────────────────
router.post('/modify-layout', authMiddleware, creditGuard, aiLimiter, async (req, res) => {
  try {
    const { currentBlocks, instruction } = req.body;

    if (!currentBlocks || !Array.isArray(currentBlocks)) {
      return res.status(400).json({ error: 'Invalid currentBlocks data. Must be an array.' });
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
      return res.status(400).json({ error: 'Invalid instruction. Must be at least 3 characters.' });
    }

    const result = await aiService.modifyLayout(currentBlocks, instruction.trim());

    // Increment credit usage for FREE users
    if (req.dbUser) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { ai_credits_used: { increment: 1 } }
        });
      } catch (incErr) {
        console.error('Failed to increment user AI credits usage:', incErr.message);
      }
    }

    return res.json({ success: true, blocks: result.blocks });

  } catch (error) {
    console.error('AI modify-layout error:', error);
    return res.status(500).json({
      error: 'Failed to modify layout.',
      message: error.message,
    });
  }
});

// ─── POST /api/ai/refine ──────────────────────────────────────
router.post('/refine', authMiddleware, creditGuard, aiLimiter, async (req, res) => {
  try {
    const { content, action } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }

    if (!action || !['grammar', 'longer', 'summarize'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action type.' });
    }

    const refined = await aiService.refineContent(content, action);

    // Increment credit usage for FREE users
    if (req.dbUser) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { ai_credits_used: { increment: 1 } }
        });
      } catch (incErr) {
        console.error('Failed to increment user AI credits usage:', incErr.message);
      }
    }

    return res.json({ success: true, refined });

  } catch (error) {
    console.error('AI refine content error:', error);
    return res.status(500).json({
      error: 'Failed to refine content.',
      message: error.message,
    });
  }
});

module.exports = router;
