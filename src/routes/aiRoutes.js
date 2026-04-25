const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Groq } = require('groq-sdk');
const { z } = require('zod');

// Ensure Groq key exists, handle gracefully if missing or instantiate Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_crash',
});

// Zod Schema for strict JSON validation
const CardSchema = z.object({
  id: z.number().or(z.string()),
  title: z.string(),
  excerpt: z.string(),
  author: z.string(),
  date: z.string(),
  image: z.string().url(),
  category: z.string()
});

const LayoutSchema = z.object({
  cards: z.array(CardSchema).min(1),
  settings: z.object({
    theme: z.string(),
    features: z.any().optional()
  })
});

// Get AI generation history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const layouts = await prisma.ai_layouts.findMany({
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
router.post('/generate-layout', async (req, res) => {
  try {
    const { prompt, layoutType, designStyle, features } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set in environment variables.' });
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
Return ONLY valid JSON. No markdown formatting, no explanations. Ensure your root object contains 'cards' and 'settings' keys.`;

    const userPrompt = `Generate a layout for a ${layoutType} with a ${designStyle} style.
Features requested: ${JSON.stringify(features || {})}.
User Request: ${prompt || 'Create a beautiful layout'}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant", // Updated to active model
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from Groq API");
    }

    // Parse and strictly validate with Zod
    const parsedData = JSON.parse(aiResponse);
    const generated_layout = LayoutSchema.parse(parsedData);

    // Save to database
    const saved = await prisma.ai_layouts.create({
      data: {
        prompt: prompt || 'Quick Template',
        layout_type: layoutType || 'single-post',
        design_style: designStyle || 'modern',
        features: features || {},
        generated_layout: generated_layout
      }
    });

    res.json({ 
      success: true, 
      layout: generated_layout,
      id: saved.id 
    });

  } catch (error) {
    console.error('Error generating AI layout:', error);
    
    // Check if it's a ZodError (sometimes instanceof fails, so check for .errors array)
    if (error.errors && Array.isArray(error.errors)) {
      return res.status(400).json({ error: 'AI generated invalid schema', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to generate layout', message: error.message });
  }
});

module.exports = router;
