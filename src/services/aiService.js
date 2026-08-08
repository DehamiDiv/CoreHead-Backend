const { Groq } = require('groq-sdk');
const { z } = require('zod');
const { randomUUID } = require('crypto');

// ─── Rule-based layout generator (fallback when no API key or error) ───
function generateRuleBasedLayout(prompt) {
  const lower = prompt.toLowerCase();

  const blocks = [];
  const id = () => randomUUID();

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
    sports: 'photo-1461896836934-ffe607ba8211',
    gaming: 'photo-1538481199705-c710c4e965fc',
    education: 'photo-1503676260728-1c00da094a0b',
    space: 'photo-1451187580459-43490279c0fa',
    music: 'photo-1511671782779-c97d3d27a1d4',
    animal: 'photo-1543466835-00a7907e9de1',
    car: 'photo-1503376780353-7e6692767b70',
    finance: 'photo-1559526324-4b87b5e36e44',
    graduation: 'photo-1627556704302-624286467c65',
  };

  const imageSynonyms = {
    food: ['food', 'recipe', 'cook', 'cooking', 'pasta', 'pizza', 'kitchen', 'restaurant', 'delicious', 'bake', 'salad'],
    bakery: ['bakery', 'cake', 'bread', 'pastry', 'cookie', 'croissant'],
    tech: ['tech', 'computer', 'software', 'coding', 'programming', 'developer', 'ai', 'gadget', 'robot'],
    travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'explore', 'beach', 'mountain'],
    health: ['health', 'fitness', 'workout', 'diet', 'gym', 'exercise', 'yoga', 'wellness'],
    sports: ['sports', 'football', 'soccer', 'cricket', 'basketball', 'tennis', 'athlete', 'training', 'run', 'marathon'],
    gaming: ['gaming', 'game', 'gamer', 'playstation', 'xbox', 'nintendo', 'steam'],
    education: ['education', 'school', 'learn', 'study', 'class', 'book', 'teacher', 'university'],
    space: ['space', 'galaxy', 'universe', 'planet', 'star', 'astronomy', 'nasa', 'mars'],
    music: ['music', 'song', 'sing', 'concert', 'guitar', 'piano', 'band', 'instrument'],
    animal: ['animal', 'pet', 'dog', 'cat', 'wildlife', 'bird', 'puppy', 'kitten'],
    car: ['car', 'vehicle', 'automotive', 'bike', 'motorcycle', 'drive', 'racing'],
    finance: ['finance', 'money', 'crypto', 'investment', 'stock', 'wealth', 'bank', 'saving'],
    graduation: ['graduation', 'graduate', 'degree', 'diploma', 'convocation', 'garland', 'cap']
  };

  let imgKey = Object.keys(imageSeeds).find(k => {
    const synonyms = imageSynonyms[k] || [k];
    return synonyms.some(syn => {
      const regex = new RegExp(`\\b${syn}\\b`, 'i');
      return regex.test(lower);
    });
  }) || 'business';

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

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    try {
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    } catch (err) {
      console.error('[Groq Client Init Error]', err.message);
    }
  }
  return groqClient;
};

const aiService = {
  async generateLayout(prompt) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    let blocks;
    let isFallback = false;

    if (!GROQ_API_KEY) {
      console.warn('No GROQ_API_KEY found. Using rule-based fallback.');
      blocks = generateRuleBasedLayout(prompt);
      return { blocks, isFallback: true };
    }

    const groq = getGroqClient();
    if (!groq) {
      console.error('Groq client could not be initialized.');
      blocks = generateRuleBasedLayout(prompt);
      return { blocks, isFallback: true };
    }

    const systemPrompt = `
You are a CMS layout generator for a blog platform called CoreHead.
Given a user's description, generate a JSON object containing a "blocks" array.

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
- For Image blocks, you MUST choose the most relevant photo URL from the following list of verified, high-quality Unsplash URLs (do NOT make up or hallucinate other photo IDs, as they will cause 404 errors):
  * Food/Cooking: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80
  * Tech/Coding/Software: https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80
  * Nature/Travel: https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80
  * Space/Science/Universe: https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80
  * Sports/Fitness/Workout: https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80
  * Gaming/Gamer: https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80
  * Education/Graduation: https://images.unsplash.com/photo-1627556704302-624286467c65?w=1200&q=80
  * Business/Office: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80
  * Generic/Abstract Gradient: https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80
- Return ONLY a valid JSON object with the "blocks" property. No markdown, no explanation.

User prompt: "${prompt}"
`;

    // AbortController 20s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }],
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }, {
        signal: controller.signal
      });

      if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0]) {
        throw new Error('Invalid response received from AI provider.');
      }

      const text = chatCompletion.choices[0].message?.content || '{}';
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Failed to parse AI response as JSON.');
      }

      const layoutSchema = z.object({
        blocks: z.array(z.object({
          id: z.string().optional(),
          type: z.enum(['Heading', 'Paragraph', 'Image', 'Quote', 'Divider', 'Button', 'Collection List']),
          content: z.any(),
          styles: z.any().optional()
        }))
      });

      const validation = layoutSchema.safeParse(parsedResult);
      if (!validation.success) {
        console.error('Zod validation failed:', validation.error.format());
        throw new Error('AI response did not match expected schema.');
      }

      blocks = validation.data.blocks;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      console.error('[AI Generation Error]', error.message);
      console.warn('Falling back to rule-based generator due to error.');
      blocks = generateRuleBasedLayout(prompt);
      isFallback = true;
    } finally {
      clearTimeout(timeoutId);
    }

    // Ensure each block has a unique id
    blocks = blocks.map((block) => ({
      ...block,
      id: block.id || randomUUID(),
    }));

    return { blocks, isFallback };
  },

  async generateBlogContent({ topic, tone, keywords, wordCount }) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    if (!GROQ_API_KEY) {
      throw new Error('No GROQ_API_KEY found in backend environment variables.');
    }

    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq client could not be initialized.');
    }

    const systemPrompt = `
You are an expert copywriter. Generate a high-quality blog post in Markdown format.
You MUST respond only in JSON matching this exact schema:
{
  "title": "Post Title",
  "excerpt": "A 2-3 sentence teaser summary of the post.",
  "content": "The full blog post content formatted in rich Markdown.",
  "seo": {
    "metaTitle": "SEO-optimized title under 60 chars.",
    "metaDescription": "SEO description under 160 chars.",
    "keywords": ["list", "of", "relevant", "keywords"]
  }
}

Rules:
- Respond with a raw JSON object ONLY. No markdown wrapper blocks (like \`\`\`json), no extra explanations.
- The "content" field should be formatted cleanly in Markdown (with headers, paragraphs, and list items as appropriate).
- Do not repeat the title inside the content body.
- Do not include HTML. Keep it clean markdown.
`;

    const prompt = `
Write a blog post about: "${topic}".
Tone: ${tone || 'informative and professional'}.
Keywords to incorporate: ${keywords ? keywords.join(', ') : 'none'}.
Target Word Count: ${wordCount || '1000 words'}.
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: GROQ_MODEL,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }, {
        signal: controller.signal
      });

      if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0]) {
        throw new Error('Invalid response received from Groq AI provider.');
      }

      const text = chatCompletion.choices[0].message?.content || '{}';
      console.log('--- RAW GROQ AI RESPONSE ---');
      console.log(text);
      console.log('----------------------------');
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Failed to parse Groq AI response as JSON.');
      }

      // 1. Unify parent nesting if AI wrapped response inside a root object (e.g., post: { ... } or blog: { ... })
      const rootKeys = Object.keys(parsedResult);
      if (rootKeys.length === 1 && typeof parsedResult[rootKeys[0]] === 'object' && parsedResult[rootKeys[0]] !== null) {
        parsedResult = parsedResult[rootKeys[0]];
      }

      // Helper to match key names case-insensitively and with synonym fallbacks
      const findKey = (obj, possibilities) => {
        const lowerPossibilities = possibilities.map(p => p.toLowerCase());
        const key = Object.keys(obj).find(k => lowerPossibilities.includes(k.toLowerCase()));
        return key ? obj[key] : null;
      };

      const title = findKey(parsedResult, ['title', 'postTitle', 'blogTitle', 'headline', 'subject']);
      const content = findKey(parsedResult, ['content', 'body', 'markdown', 'postContent', 'text']);
      const excerpt = findKey(parsedResult, ['excerpt', 'summary', 'description', 'teaser']) || '';
      
      let seo = findKey(parsedResult, ['seo', 'seoMetadata', 'metadata', 'seo_metadata', 'seoDetails']);
      
      let finalSeo = {
        metaTitle: '',
        metaDescription: '',
        keywords: []
      };

      if (seo && typeof seo === 'object') {
        finalSeo.metaTitle = findKey(seo, ['metaTitle', 'seoTitle', 'title']) || title || '';
        finalSeo.metaDescription = findKey(seo, ['metaDescription', 'seoDescription', 'description']) || excerpt || '';
        finalSeo.keywords = findKey(seo, ['keywords', 'tags']) || [];
      } else {
        finalSeo.metaTitle = findKey(parsedResult, ['metaTitle', 'seoTitle']) || title || '';
        finalSeo.metaDescription = findKey(parsedResult, ['metaDescription', 'seoDescription']) || excerpt || '';
        finalSeo.keywords = findKey(parsedResult, ['keywords', 'tags']) || [];
      }

      if (!title || !content) {
        throw new Error(`AI response did not contain title or content fields. Keys returned: ${Object.keys(parsedResult).join(', ')}`);
      }

      return {
        title,
        excerpt,
        content,
        seo: {
          metaTitle: finalSeo.metaTitle,
          metaDescription: finalSeo.metaDescription,
          keywords: Array.isArray(finalSeo.keywords) ? finalSeo.keywords : (typeof finalSeo.keywords === 'string' ? finalSeo.keywords.split(',') : [])
        }
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again.');
      }
      console.error('[AI Content Generation Error]', error.message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async modifyLayout(currentBlocks, instruction) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    if (!GROQ_API_KEY) {
      console.warn('No GROQ_API_KEY found. Using programmatic fallback for modification.');
      return { blocks: this.modifyFallback(currentBlocks, instruction) };
    }

    const groq = getGroqClient();
    if (!groq) {
      console.error('Groq client could not be initialized for layout modification.');
      return { blocks: this.modifyFallback(currentBlocks, instruction) };
    }

    const systemPrompt = `
You are a CMS layout modification assistant.
You are given:
1. The user's current array of layout blocks.
2. An instruction on what modification to perform (e.g. add a button, change titles, delete blocks, swap order).

You must parse the current array of blocks and generate the MODIFIED array of blocks.
Each block in the output array MUST follow this exact schema:
{
  "id": "<keep the same id if modified/unchanged, or create random UUID if new block>",
  "type": "<one of: Heading | Paragraph | Image | Quote | Divider | Button | Collection List | hero | card | banner | featured | quote | newsletter>",
  "content": <content string or object>,
  "styles": { <optional CSS-in-JS style properties> }
}

Keep existing block IDs unchanged unless you are deleting them or adding new ones.
Make sure you strictly apply the user's instructions.
Return ONLY a valid JSON object with a single root property "blocks" containing the array of modified blocks. Do not return markdown code blocks, do not return explanations.
`;

    const userPrompt = `
Current Layout Blocks:
${JSON.stringify(currentBlocks, null, 2)}

User Instruction:
"${instruction}"
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }, {
        signal: controller.signal
      });

      if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0]) {
        throw new Error('Invalid response received from AI provider.');
      }

      const text = chatCompletion.choices[0].message?.content || '{}';
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Failed to parse AI response as JSON.');
      }

      const layoutSchema = z.object({
        blocks: z.array(z.object({
          id: z.string().optional(),
          type: z.string(),
          content: z.any().optional(),
          styles: z.any().optional(),
          title: z.string().optional(),
          excerpt: z.string().optional(),
          author: z.string().optional(),
          date: z.string().optional(),
          image: z.string().optional(),
          category: z.string().optional()
        }))
      });

      const validation = layoutSchema.safeParse(parsedResult);
      if (!validation.success) {
        console.error('Modify validation failed:', validation.error.format());
        throw new Error('AI modified response did not match expected schema.');
      }

      const blocks = validation.data.blocks.map(block => ({
        ...block,
        id: block.id || randomUUID()
      }));

      return { blocks };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      console.error('[AI Modify Error]', error.message);
      return { blocks: this.modifyFallback(currentBlocks, instruction) };
    } finally {
      clearTimeout(timeoutId);
    }
  },

  modifyFallback(currentBlocks, instruction) {
    const lower = instruction.toLowerCase();
    const id = () => randomUUID();
    
    if (lower.includes('add') || lower.includes('insert') || lower.includes('create') || lower.includes('new')) {
      return [
        ...currentBlocks,
        {
          id: id(),
          type: 'banner',
          title: 'AI Refined Banner',
          excerpt: `Modified block generated according to: "${instruction}"`,
          date: new Date().toISOString().split('T')[0],
          category: 'Refined'
        }
      ];
    }
    
    if (lower.includes('delete') || lower.includes('remove')) {
      if (currentBlocks.length > 1) {
        return currentBlocks.slice(0, -1);
      }
    }
    
    return [
      ...currentBlocks,
      {
        id: id(),
        type: 'Heading',
        content: `Refined: "${instruction}"`,
        styles: { textAlign: 'center', color: '#4f46e5', marginTop: '20px' }
      }
    ];
  }
};

module.exports = aiService;
