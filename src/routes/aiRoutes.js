const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Groq } = require('groq-sdk');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middlewares/authMiddleware');

// Ensure Groq key exists before instantiation
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn('GROQ_API_KEY is missing. AI features will be disabled.');
}

// Zod Schema for strict JSON validation
const CardSchema = z.object({
  id: z.number().or(z.string()),
  title: z.string(),
  excerpt: z.string(),
  author: z.string(),
  date: z.string(),
  image: z.string().url().optional().or(z.literal("")).default("https://picsum.photos/seed/default/800/600"),
  category: z.string()
});

const LayoutSchema = z.object({
  cards: z.array(CardSchema).min(1),
  settings: z.object({
    theme: z.string(),
    features: z.any().optional()
  })
});

// Fallback layout in case AI fails
const FALLBACK_LAYOUT = {
  cards: [
    {
      id: "fallback-1",
      title: "Sample Blog Post",
      excerpt: "The AI was unable to generate a layout, but here is a sample structure for you to build upon.",
      author: "System",
      date: new Date().toISOString().split('T')[0],
      image: "https://picsum.photos/seed/fallback/800/600",
      category: "General"
    }
  ],
  settings: {
    theme: "Modern Light",
    features: { sidebar: true }
  }
};

// Rate limiter for AI endpoints (10 requests per 15 minutes)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get AI generation history (Protected)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const layouts = await prisma.ai_layouts.findMany({
      where: {
        user_id: req.user.id // Filter history by authenticated user
      },
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, layouts });
  } catch (error) {
    console.error('Error fetching AI history:', error);
    res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

// Generate and Save Layout
router.post('/generate-layout', authMiddleware, aiLimiter, async (req, res) => {
  try {
    let { prompt, layoutType, designStyle, features } = req.body;

    // Security: Input validation & sanitization
    if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
      return res.status(400).json({ error: 'Invalid prompt. Please provide a prompt under 500 characters.' });
    }
    
    // Basic sanitization: strip HTML tags and trim
    prompt = prompt.replace(/<[^>]*>?/gm, '').trim();

    if (prompt.length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty or contain only HTML tags.' });
    }

    if (!groq) {
      return res.status(503).json({ error: 'AI Service is currently unavailable (API Key missing).' });
    }

    const systemPrompt = `You are an expert CMS layout designer. Generate a JSON layout structure based on the user's prompt.
The layout must conform exactly to this JSON schema:
{
  "cards": [
    {
      "id": "number or unique string",
      "title": "Post title",
      "excerpt": "Short excerpt",
      "author": "Author name",
      "date": "YYYY-MM-DD",
      "image": "Valid URL (use https://picsum.photos/seed/any_random_string/800/600 for placeholders)",
      "category": "Category name"
    }
  ],
  "settings": {
    "theme": "Theme name",
    "features": { "sidebar": true }
  }
}
Return ONLY valid JSON. No markdown formatting, no explanations.`;

    const userPrompt = `Generate a layout for a ${layoutType || 'blog'} with a ${designStyle || 'modern'} style.
Features requested: ${JSON.stringify(features || {})}.
User Request: ${prompt}`;

    // timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout

    let chatCompletion;
    try {
      chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        response_format: { type: "json_object" }
      }, { signal: controller.signal });
    } catch (apiError) {
      if (apiError.name === 'AbortError') {
        return res.status(504).json({ error: 'AI request timed out. Please try again.' });
      }
      throw apiError; // Re-throw other errors to be caught by outer catch
    } finally {
      clearTimeout(timeoutId);
    }

    if (!chatCompletion || !chatCompletion.choices) {
      throw new Error("No response or invalid structure from AI service");
    }

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("Empty response from AI service");
    }

    let generated_layout;
    try {
      // Parse and strictly validate with Zod
      const parsedData = JSON.parse(aiResponse);
      generated_layout = LayoutSchema.parse(parsedData);
    } catch (parseError) {
      console.error('AI JSON Parse/Validation Error:', parseError);
      // Fallback to a safe layout if AI fails
      generated_layout = FALLBACK_LAYOUT;
    }

    // Save to database with user association
    const saved = await prisma.ai_layouts.create({
      data: {
        user_id: req.user.id, // Associate with current user
        prompt: prompt,
        layout_type: layoutType || 'single-post',
        design_style: designStyle || 'modern',
        features: features || {},
        generated_layout: generated_layout
      }
    });

    res.json({ 
      success: true, 
      layout: generated_layout,
      id: saved.id,
      isFallback: generated_layout === FALLBACK_LAYOUT
    });

  } catch (error) {
    console.error('Error in AI generation route:', error);
    res.status(500).json({ 
      error: 'Failed to generate layout', 
      message: error.message 
    });
  }
});

module.exports = router;
