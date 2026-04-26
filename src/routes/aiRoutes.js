const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const { Groq } = require('groq-sdk');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middlewares/authMiddleware');

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

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    let blocks;

    if (GEMINI_API_KEY) {
      // ── Real Gemini AI generation ────────────────────────────
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const systemPrompt = `
You are a CMS layout generator for a blog platform called CoreHead.
Given a user's description, generate a JSON array of layout blocks.

Each block MUST follow this exact schema:
{
  "id": "<unique string>",
  "type": "<one of: Heading | Paragraph | Image | Quote | Divider | Button | Collection List>",
  "content": <string for most types, { "text": string, "url": string } for Button, { "limit": number, "category": string } for Collection List>,
  "styles": { <optional CSS-in-JS style properties> }
}

Rules:
- Always start with a Heading block as the page title
- Use Paragraph blocks for descriptive text
- Use Collection List block to show blog posts (type="Blog Archive" pages)
- Use Image block for hero/banner images with a relevant Unsplash URL
- Use Divider blocks to separate sections
- Use Button blocks for CTAs
- Generate 4-8 blocks total
- Make content relevant to the user's prompt
- IMPORTANT: Add { "marginBottom": "30px" } to the "styles" of EVERY block so they don't overlap and have proper spacing.
- For Image blocks, use: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80
- Return ONLY valid JSON array, no markdown, no explanation

User prompt: "${prompt}"
`;

      const result = await model.generateContent(systemPrompt);
      const text = result.response.text().trim();

      // Strip markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      blocks = JSON.parse(cleaned);

    } else {
      // ── Smart rule-based fallback (no API key needed) ────────
      blocks = generateRuleBasedLayout(prompt);
    }

    // Ensure each block has a unique id
    blocks = blocks.map((block, i) => ({
      ...block,
      id: block.id || `ai-block-${Date.now()}-${i}`,
    }));

    // Save to DB for history
    let saved;
    try {
      saved = await prisma.ai_layouts.create({
        data: {
          user_id: req.user.id, // Associate with current user
          prompt,
          layout_type: 'blog-archive',
          design_style: 'modern',
          features: {},
          generated_layout: { blocks },
        },
      });
    } catch (dbErr) {
      // Non-critical — don't fail the request if DB save fails
      console.warn('AI layout DB save failed:', dbErr.message);
    }

    return res.json({ 
      success: true, 
      blocks,
      id: saved ? saved.id : null,
      isFallback: !GEMINI_API_KEY
    });

  } catch (error) {
    console.error('AI generate-layout error:', error);
    return res.status(500).json({
      error: 'Failed to generate layout.',
      message: error.message,
    });
  }
});
    });
  }
});

// ─── GET /api/ai/history ──────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const layouts = await prisma.ai_layouts.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    return res.json({ success: true, layouts });
  } catch (error) {
    console.error('Error fetching AI history:', error);
    return res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

// ─── Rule-based layout generator (fallback when no API key) ───
function generateRuleBasedLayout(prompt) {
  const lower = prompt.toLowerCase();

  const blocks = [];
  let idx = 0;
  const id = () => `ai-${Date.now()}-${idx++}`;

  // ── Extract a topic from the prompt ──
  const topic = prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt;

  // 1. Always add a heading
  blocks.push({
    id: id(),
    type: 'Heading',
    content: toTitleCase(topic),
    styles: { textAlign: 'center', fontSize: '36px', marginBottom: '30px' },
  });

  // 2. Hero image
  const imageSeeds = {
    food: 'photo-1504674900247-0877df9cc836',
    bakery: 'photo-1608198093002-ad4e005484ec',
    tech: 'photo-1518770660439-4636190af475',
    travel: 'photo-1476514525535-07fb3b4ae5f1',
    health: 'photo-1498837167922-ddd27525d352',
    business: 'photo-1507003211169-0a1dd7228f2d',
    fashion: 'photo-1558769132-cb1aea458c5e',
    nature: 'photo-1441974231531-c6227db76b6e',
  };
  let imgKey = Object.keys(imageSeeds).find(k => lower.includes(k)) || 'business';
  blocks.push({
    id: id(),
    type: 'Image',
    content: `https://images.unsplash.com/${imageSeeds[imgKey]}?w=1200&q=80`,
    styles: { borderRadius: '12px', marginBottom: '30px' },
  });

  // 3. Intro paragraph
  blocks.push({
    id: id(),
    type: 'Paragraph',
    content: `Welcome to our ${topic} section. Explore the latest articles, insights, and updates carefully curated for you.`,
    styles: { textAlign: 'center', color: '#64748b', marginBottom: '30px' },
  });

  // 4. Divider
  blocks.push({ id: id(), type: 'Divider', content: '', styles: { marginBottom: '30px' } });

  // 5. Sub-heading for posts section
  blocks.push({
    id: id(),
    type: 'Heading',
    content: 'Latest Posts',
    styles: { fontSize: '24px', marginBottom: '30px' },
  });

  // 6. Collection List (always useful for a blog)
  blocks.push({
    id: id(),
    type: 'Collection List',
    content: { limit: 6, category: '' },
    styles: { marginBottom: '30px' },
  });

  // 7. CTA button
  if (lower.includes('contact') || lower.includes('learn') || lower.includes('get started') || lower.includes('subscribe')) {
    blocks.push({
      id: id(),
      type: 'Button',
      content: { text: 'Get Started', url: '#' },
      styles: {},
    });
  }

  // 8. Quote if motivational/lifestyle
  if (lower.includes('inspir') || lower.includes('motivat') || lower.includes('lifestyle') || lower.includes('tip')) {
    blocks.push({
      id: id(),
      type: 'Quote',
      content: `"The secret of getting ahead is getting started." — Mark Twain`,
      styles: {},
    });
  }

  return blocks;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

module.exports = router;
