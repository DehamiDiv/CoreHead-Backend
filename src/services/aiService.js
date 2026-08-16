const { Groq } = require('groq-sdk');
const { randomUUID } = require('crypto');
const {
  layoutDocumentV1Schema,
  normalizeLayoutDocumentV1,
  validateLayoutDocumentV1,
} = require('../contracts/layoutContract');
const { templateTypeToKind } = require('../contracts/templateLayout');

// ─── Rule-based layout generator (fallback when no API key or error) ───
function generateRuleBasedLayout(prompt, options = {}) {
  const lower = prompt.toLowerCase();
  const kind = templateTypeToKind(options.layoutType || options.kind);
  const blocks = [];
  const id = () => randomUUID();

  // ── Extract a topic from the prompt ──
  const topic = prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt;

  if (kind === 'single-post') {
    blocks.push(
      {
        id: id(),
        type: 'Image',
        content: '',
        bindings: { content: 'post.coverImage' },
        styles: { borderRadius: '12px', marginBottom: '30px' },
      },
      {
        id: id(),
        type: 'Heading',
        content: '',
        level: 1,
        bindings: { content: 'post.title' },
        styles: { textAlign: 'center', fontSize: '36px', marginBottom: '20px' },
      },
      {
        id: id(),
        type: 'Paragraph',
        content: '',
        bindings: { content: 'post.excerpt' },
        styles: { textAlign: 'center', color: '#64748b', marginBottom: '30px' },
      },
      { id: id(), type: 'Divider', content: '', styles: { marginBottom: '30px' } },
      {
        id: id(),
        type: 'Paragraph',
        content: '',
        bindings: { content: 'post.contentHtml' },
        styles: { lineHeight: '1.75' },
      },
    );
    return {
      schemaVersion: '1.0',
      kind,
      name: options.name || `${toTitleCase(topic)} Post`,
      blocks,
      metadata: { designStyle: options.designStyle || 'modern', origin: 'ai' },
    };
  }

  if (kind === 'home-page') {
    blocks.push(
      {
        id: id(),
        type: 'Container',
        content: '',
        styles: { padding: '72px 24px', maxWidth: '1120px' },
      },
    );
    const heroId = blocks[0].id;
    blocks.push(
      {
        id: id(),
        type: 'Heading',
        content: 'Site name',
        level: 1,
        parentId: heroId,
        bindings: { content: 'site.name' },
        styles: { fontSize: '56px', marginBottom: '18px' },
      },
      {
        id: id(),
        type: 'Paragraph',
        content: `Stories, ideas, and updates about ${topic}.`,
        parentId: heroId,
        bindings: { content: 'site.tagline' },
        styles: { fontSize: '20px', lineHeight: '1.6', maxWidth: '720px' },
      },
      {
        id: id(),
        type: 'Heading',
        content: 'Latest stories',
        level: 2,
        styles: { fontSize: '34px', marginTop: '48px', marginBottom: '24px' },
      },
      {
        id: id(),
        type: 'Collection List',
        content: { limit: 6, category: '' },
        styles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
      },
    );
    if (lower.includes('subscribe') || lower.includes('newsletter')) {
      blocks.push({
        id: id(),
        type: 'Newsletter',
        content: {
          title: 'Join the newsletter',
          description: 'Get new stories delivered to your inbox.',
          buttonText: 'Subscribe',
          placeholder: 'you@example.com',
        },
        styles: { marginTop: '56px', padding: '36px', borderRadius: '18px' },
      });
    }
    return {
      schemaVersion: '1.0',
      kind,
      name: options.name || `${toTitleCase(topic)} Home`,
      blocks,
      metadata: { designStyle: options.designStyle || 'modern', origin: 'ai' },
    };
  }

  // Blog Archive fallback
  blocks.push({
    id: id(),
    type: 'Heading',
    content: toTitleCase(topic),
    level: 1,
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

  // 6. Collection List
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

  return {
    schemaVersion: '1.0',
    kind,
    name: options.name || `${toTitleCase(topic)} Archive`,
    blocks,
    metadata: { designStyle: options.designStyle || 'modern', origin: 'ai' },
  };
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

function buildLayoutSystemPrompt(options = {}) {
  const kind = templateTypeToKind(options.layoutType || options.kind);
  const semanticRules = kind === 'single-post'
    ? 'The document MUST contain bindings.content="post.title" and bindings.content="post.contentHtml". Use post.coverImage for a dynamic cover when an Image is included. Do not add a Collection List unless explicitly requested.'
    : kind === 'home-page'
      ? 'The document MUST contain bindings.content="site.name" and at least one Collection List block for published posts. Prefer site.tagline or site.description for supporting copy.'
      : 'The document MUST contain at least one Collection List block with content.limit from 1 to 50 and a string content.category.';
  return [
    'You generate CoreHead CMS layouts.',
    'Return exactly one JSON object and no markdown or explanation.',
    `The requested kind is "${kind}". The root kind MUST match it.`,
    `Use design style "${String(options.designStyle || 'modern')}".`,
    `Requested optional features: ${JSON.stringify(options.features || {})}.`,
    semanticRules,
    'Use dynamic bindings for CMS values. Do not put placeholder strings such as {post.title} or {site.name} in content.',
    'Use unique string IDs. parentId may only reference a Container or Columns block. Never emit scripts, event handlers, javascript: URLs, arbitrary CSS properties, or undocumented fields.',
    'The following JSON Schema is the complete LayoutDocument v1 contract:',
    JSON.stringify(layoutDocumentV1Schema),
  ].join('\n');
}

function completionText(completion) {
  const text = completion?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid response received from AI provider.');
  }
  return text;
}

function prepareAiLayoutResponse(rawText, options = {}) {
  let parsed;
  try {
    parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
  } catch {
    return {
      layout: null,
      validation: {
        valid: false,
        errors: [{ code: 'ai.invalid_json', path: '$', message: 'AI response is not valid JSON.' }],
        warnings: [],
      },
    };
  }

  if (parsed?.layout && typeof parsed.layout === 'object') parsed = parsed.layout;
  const kind = templateTypeToKind(options.layoutType || options.kind);
  let normalized;
  try {
    normalized = normalizeLayoutDocumentV1(parsed, {
      name: parsed?.name || options.name || (kind === 'blog-archive' ? 'AI Blog Archive' : kind === 'home-page' ? 'AI Home Page' : 'AI Single Post'),
      kind,
      origin: 'ai',
      designStyle: options.designStyle || 'modern',
    });
  } catch (error) {
    return {
      layout: null,
      validation: {
        valid: false,
        errors: [{ code: 'ai.layout_shape', path: '$', message: error.message }],
        warnings: [],
      },
    };
  }
  const layout = {
    ...normalized.document,
    kind,
    name: String(normalized.document.name || options.name || 'AI Layout'),
    metadata: {
      ...normalized.document.metadata,
      designStyle: options.designStyle || normalized.document.metadata?.designStyle || 'modern',
      origin: 'ai',
    },
  };
  const validation = validateLayoutDocumentV1(layout);
  return {
    layout,
    validation: {
      ...validation,
      warnings: [...normalized.warnings, ...validation.warnings],
    },
  };
}

const aiService = {
  async generateLayout(prompt, options = {}) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const kind = templateTypeToKind(options.layoutType || options.kind);
    const generationOptions = {
      ...options,
      kind,
      layoutType: kind,
      designStyle: options.designStyle || 'modern',
    };
    const makeFallback = () => {
      const layout = generateRuleBasedLayout(prompt, generationOptions);
      const validation = validateLayoutDocumentV1(layout);
      if (!validation.valid) {
        throw new Error(`Fallback layout failed validation: ${validation.errors.map((issue) => issue.message).join('; ')}`);
      }
      return { layout, blocks: layout.blocks, isFallback: true, provider: 'rule-based' };
    };

    if (!GROQ_API_KEY && !options.client) {
      console.warn('No GROQ_API_KEY found. Using rule-based fallback.');
      return makeFallback();
    }

    const groq = options.client || getGroqClient();
    if (!groq) {
      console.error('Groq client could not be initialized.');
      return makeFallback();
    }

    const systemPrompt = buildLayoutSystemPrompt(generationOptions);
    const userPrompt = `Create a ${kind} layout for this request:\n${prompt}`;

    // AbortController 20s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const requestCompletion = async (messages) => groq.chat.completions.create({
        messages,
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }, { signal: controller.signal });

      const firstCompletion = await requestCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      const firstText = completionText(firstCompletion);
      let prepared = prepareAiLayoutResponse(firstText, generationOptions);

      if (!prepared.validation.valid) {
        const repairPrompt = [
          'Repair the previous JSON so it conforms exactly to LayoutDocument v1.',
          `Validation errors: ${JSON.stringify(prepared.validation.errors)}`,
          `Previous JSON: ${firstText}`,
          'Return only the corrected JSON object.',
        ].join('\n');
        const repairedCompletion = await requestCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: repairPrompt },
        ]);
        prepared = prepareAiLayoutResponse(completionText(repairedCompletion), generationOptions);
      }

      if (!prepared.validation.valid) {
        console.warn('AI response failed canonical validation after repair. Using fallback.');
        return makeFallback();
      }

      return {
        layout: prepared.layout,
        blocks: prepared.layout.blocks,
        isFallback: false,
        provider: 'groq',
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      console.error('[AI Generation Error]', error.message);
      console.warn('Falling back to rule-based generator due to error.');
      return makeFallback();
    } finally {
      clearTimeout(timeoutId);
    }
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

  async modifyLayout(currentLayout, instruction, options = {}) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const current = normalizeLayoutDocumentV1(currentLayout, {
      name: options.name || 'AI Modified Layout',
      kind: options.layoutType || options.kind,
      origin: 'ai',
    }).document;
    const generationOptions = {
      ...options,
      kind: current.kind,
      layoutType: current.kind,
      designStyle: options.designStyle || current.metadata?.designStyle || 'modern',
    };

    if (!GROQ_API_KEY && !options.client) {
      console.warn('No GROQ_API_KEY found. Using programmatic fallback for modification.');
      const layout = this.modifyFallback(current, instruction);
      return { layout, blocks: layout.blocks, isFallback: true };
    }

    const groq = options.client || getGroqClient();
    if (!groq) {
      console.error('Groq client could not be initialized for layout modification.');
      const layout = this.modifyFallback(current, instruction);
      return { layout, blocks: layout.blocks, isFallback: true };
    }

    const systemPrompt = `${buildLayoutSystemPrompt(generationOptions)}\nPreserve existing block IDs for unchanged blocks. Apply only the requested modification.`;

    const userPrompt = `
Current LayoutDocument:
${JSON.stringify(current, null, 2)}

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

      const prepared = prepareAiLayoutResponse(completionText(chatCompletion), generationOptions);
      if (!prepared.validation.valid) {
        console.warn('AI modification failed canonical validation. Using fallback.');
        const layout = this.modifyFallback(current, instruction);
        return { layout, blocks: layout.blocks, isFallback: true };
      }
      return { layout: prepared.layout, blocks: prepared.layout.blocks, isFallback: false };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      console.error('[AI Modify Error]', error.message);
      const layout = this.modifyFallback(current, instruction);
      return { layout, blocks: layout.blocks, isFallback: true };
    } finally {
      clearTimeout(timeoutId);
    }
  },

  modifyFallback(currentLayout, instruction) {
    const lower = instruction.toLowerCase();
    const id = () => randomUUID();
    const original = normalizeLayoutDocumentV1(currentLayout, {
      name: currentLayout?.name || 'AI Modified Layout',
      kind: currentLayout?.kind,
      origin: 'ai',
    }).document;
    let blocks = [...original.blocks];

    if (lower.includes('add') || lower.includes('insert') || lower.includes('create') || lower.includes('new')) {
      blocks.push({
        id: id(),
        type: 'Button',
        content: { text: 'Learn More', url: '#' },
        styles: { marginTop: '20px' },
      });
    } else if ((lower.includes('delete') || lower.includes('remove')) && blocks.length > 1) {
      blocks = blocks.slice(0, -1);
    } else {
      blocks.push({
        id: id(),
        type: 'Heading',
        content: `Refined: ${instruction}`,
        styles: { textAlign: 'center', color: '#4f46e5', marginTop: '20px' },
      });
    }

    const candidate = {
      ...original,
      blocks,
      metadata: { ...original.metadata, origin: 'ai' },
    };
    return validateLayoutDocumentV1(candidate).valid ? candidate : original;
  },

  async refineContent(content, action) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured in backend environment variables.');
    }

    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq client could not be initialized. Please check backend config.');
    }

    let instructionPrompt = "";
    if (action === "grammar") {
      instructionPrompt = "Fix spelling, grammar, punctuation, and typographical mistakes. Keep the HTML or content structure identical, but output polished text.";
    } else if (action === "longer") {
      instructionPrompt = "Expand on the ideas of the post. Elaborate on the details and enrich the content, making it twice as long. Maintain the style and tone.";
    } else if (action === "summarize") {
      instructionPrompt = "Condense the content down to its main points. Summarize the content concisely, making it shorter and punchy.";
    }

    const systemPrompt = `
You are an expert editor. You will receive content, perform the requested edit action, and return the modified content ONLY.
Rules:
- Output only the updated content text. Do not wrap in markdown code blocks, do not explain the changes, do not write 'Here is your text:'.
- Maintain any HTML formatting (like <p>, <h1>, <strong>, <ul>, etc.) present in the input. If the input contains HTML tags, make sure they remain valid and well-formed.
`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Action: ${instructionPrompt}\n\nInput Content:\n${content}` }
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
      });

      const refined = chatCompletion.choices[0]?.message?.content?.trim();
      if (!refined) {
        throw new Error('AI returned an empty response.');
      }
      return refined;
    } catch (error) {
      console.error('LLM refining failed:', error);
      throw error;
    }
  }
};

module.exports = aiService;
