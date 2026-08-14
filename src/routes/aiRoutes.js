const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');
const aiService = require('../services/aiService');
const { promoteAiLayout } = require('../services/aiLayoutPromotionService');
const { requireSite } = require('../middlewares/siteMiddleware');
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
router.post('/generate-layout', authMiddleware, requireSite, aiLimiter, async (req, res) => {
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
    let generated;

    try {
      // Use the service created as part of Member 04 contribution
      generated = await aiService.generateLayout(sanitizedPrompt, {
        layoutType: layoutType || 'blog-archive',
        designStyle: designStyle || 'modern',
        features: features || {},
      });
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
          site_id: req.siteId,
          prompt,
          layout_type: layoutType || 'blog-archive',
          design_style: designStyle || 'modern',
          features: features || {},
          generated_layout: generated.layout,
        },
      });
    } catch (dbErr) {
      console.warn('AI layout DB save failed:', dbErr.message);
    }

    return res.json({
      success: true,
      layout: generated.layout,
      blocks: generated.blocks,
      id: saved ? saved.id : null,
      isFallback: generated.isFallback,
      provider: generated.provider,
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
router.get('/history', authMiddleware, requireSite, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const layouts = await prisma.ai_layouts.findMany({
      where: { user_id: req.user.id, site_id: req.siteId },
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
router.delete('/history/:id', authMiddleware, requireSite, async (req, res) => {
  try {
    const { id } = req.params;

    const layout = await prisma.ai_layouts.findFirst({
      where: { id: parseInt(id), user_id: req.user.id, site_id: req.siteId }
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
router.put('/history/:id', authMiddleware, requireSite, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long.' });
    }

    const layout = await prisma.ai_layouts.findFirst({
      where: { id: parseInt(id), user_id: req.user.id, site_id: req.siteId }
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

// Save a validated AI generation into the site's normal template library as a draft.
router.post('/history/:id/promote', authMiddleware, requireSite, async (req, res) => {
  try {
    const result = await promoteAiLayout({
      prisma,
      historyId: req.params.id,
      userId: req.user.id,
      siteId: req.siteId,
      name: req.body?.name,
    });
    return res.status(result.alreadyPromoted ? 200 : 201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      error: error.message,
      validationErrors: error.validationErrors,
    });
  }
});

// ─── POST /api/ai/generate-blog ──────────────────────────────
router.post('/generate-blog', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { topic, tone, keywords, wordCount } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
      return res.status(400).json({ error: 'Invalid topic. Please describe your topic in at least 5 characters.' });
    }

    if (topic.length > 500) {
      return res.status(400).json({ error: 'Topic too long (max 500 characters allowed).' });
    }

    const result = await aiService.generateBlogContent({ topic, tone, keywords, wordCount });
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
router.post('/modify-layout', authMiddleware, requireSite, aiLimiter, async (req, res) => {
  try {
    const { currentBlocks, currentLayout, instruction, layoutType, designStyle } = req.body;
    const sourceLayout = currentLayout || currentBlocks;

    if (!sourceLayout || (!Array.isArray(sourceLayout) && typeof sourceLayout !== 'object')) {
      return res.status(400).json({ error: 'A current layout document or block array is required.' });
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
      return res.status(400).json({ error: 'Invalid instruction. Must be at least 3 characters.' });
    }

    const result = await aiService.modifyLayout(sourceLayout, instruction.trim(), {
      layoutType,
      designStyle,
    });
    return res.json({
      success: true,
      layout: result.layout,
      blocks: result.blocks,
      isFallback: result.isFallback,
    });

  } catch (error) {
    console.error('AI modify-layout error:', error);
    return res.status(500).json({
      error: 'Failed to modify layout.',
      message: error.message,
    });
  }
});

// ─── POST /api/ai/refine ──────────────────────────────────────
router.post('/refine', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { content, action } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }

    if (!action || !['grammar', 'longer', 'summarize'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action type.' });
    }

    const refined = await aiService.refineContent(content, action);
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
