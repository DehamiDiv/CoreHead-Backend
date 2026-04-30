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
    const GROQ_API_KEY   = process.env.GROQ_API_KEY;

    let blocks = null;
    let provider = 'fallback';

    const systemPrompt = `
You are a CMS layout generator for a blog platform called CoreHead.
Given a user's description, generate a JSON array of layout blocks.

Available Block Types:
- Heading: For titles and section headers.
- Paragraph: For descriptive text.
- Image: For visual content. Use a relevant Unsplash URL.
- Quote: For testimonials or highlights.
- Divider: To separate sections.
- Button: For call-to-actions. Content: { "text": string, "url": string }.
- Collection List: To show blog posts. Content: { "limit": number, "category": string }.
- Featured Carousel: A large hero slider for posts. Content: { "limit": number }.
- Video: Embed a YouTube video. Content: string (URL).
- Newsletter: A subscription form. Content: { "title": string, "buttonText": string }.
- Social Links: Icons for social media. Content: Array of strings.
- Spacer: Transparent vertical spacing. Content: string (e.g. "50px").

Each block MUST follow this exact schema:
{
  "id": "<unique string>",
  "type": "<one of the types above>",
  "content": <content based on type>,
  "styles": { <optional CSS-in-JS style properties like textAlign, color, fontSize, padding, margin, backgroundColor, borderRadius> }
}

Rules:
- Always start with a Heading block as the page title.
- Use a mix of blocks to create a professional, modern layout.
- Always include a Collection List block.
- IMPORTANT: Add { "marginBottom": "30px" } to the "styles" of EVERY block.
- For Image blocks, use relevant high-quality Unsplash URLs.
- Return ONLY a valid JSON array. No markdown code fences, no extra text.

User prompt: "${prompt}"
`;

    const parseBlocks = (text) => {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const cleaned = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(cleaned);
    };

    // ── 1. Try Groq (llama3-70b) — free and fast ─────────────────
    if (GROQ_API_KEY && !blocks) {
      try {
        const groq = new Groq({ apiKey: GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.7,
          max_tokens: 4000,
        });
        const text = completion.choices[0]?.message?.content?.trim() || '';
        blocks = parseBlocks(text);
        provider = 'groq';
        console.log('✅ AI generated via Groq');
      } catch (groqErr) {
        console.warn('⚠️ Groq failed, trying Gemini:', groqErr.message);
      }
    }

    // ── 2. Try Gemini as fallback ─────────────────────────────────
    if (GEMINI_API_KEY && !blocks) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(systemPrompt);
        const text = result.response.text().trim();
        blocks = parseBlocks(text);
        provider = 'gemini';
        console.log('✅ AI generated via Gemini');
      } catch (geminiErr) {
        console.warn('⚠️ Gemini failed, using rule-based:', geminiErr.message);
      }
    }

    // ── 3. Smart rule-based fallback — always works ───────────────
    if (!blocks) {
      blocks = generateRuleBasedLayout(prompt);
      provider = 'rule-based';
      console.log('✅ Layout generated via rule-based fallback');
    }

    // Ensure each block has a unique id
    blocks = blocks.map((block, i) => ({
      ...block,
      id: block.id || `ai-block-${Date.now()}-${i}`,
    }));

    // Save to DB for history (non-critical)
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
      provider,
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
