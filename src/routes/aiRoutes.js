const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Create a mock generated layout
    const generated_layout = {
      cards: [
        {
          id: Date.now(),
          title: 'AI Generated: ' + (prompt?.slice(0, 50) || 'New Layout'),
          excerpt: `A custom ${designStyle} ${layoutType} generated for your prompt.`,
          author: 'AI Designer',
          date: new Date().toISOString().split('T')[0],
          image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/600`,
          category: layoutType || 'AI'
        }
      ],
      settings: {
        theme: designStyle || 'modern',
        features: features || {}
      }
    };

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
    res.status(500).json({ error: 'Failed to generate layout', message: error.message });
  }
});

module.exports = router;
