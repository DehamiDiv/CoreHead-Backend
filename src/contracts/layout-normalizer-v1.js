const {
  BINDING_PATHS,
  BLOCK_TYPES,
  STYLE_PROPERTIES,
} = require('./layout-validator-v1');

const TYPE_ALIASES = new Map([
  ['heading', 'Heading'],
  ['paragraph', 'Paragraph'],
  ['rich text', 'Paragraph'],
  ['rich-text', 'Paragraph'],
  ['image', 'Image'],
  ['quote', 'Quote'],
  ['divider', 'Divider'],
  ['button', 'Button'],
  ['container', 'Container'],
  ['columns', 'Columns'],
  ['collection list', 'Collection List'],
  ['collection', 'Collection List'],
  ['blog loop', 'Collection List'],
  ['blog-loop', 'Collection List'],
  ['blog_loop', 'Collection List'],
  ['featured carousel', 'Featured Carousel'],
  ['video', 'Video'],
  ['newsletter', 'Newsletter'],
  ['social links', 'Social Links'],
  ['social', 'Social Links'],
  ['spacer', 'Spacer'],
  ['code block', 'Code Block'],
  ['code', 'Code Block'],
  ['html', 'Html'],
  ['markdown', 'Markdown'],
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function slug(value, fallback) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || fallback;
}

function canonicalType(type) {
  if (BLOCK_TYPES.includes(type)) return type;
  return TYPE_ALIASES.get(String(type || '').trim().toLowerCase()) || null;
}

function inferKind(blocks, explicitKind) {
  if (explicitKind === 'single-post' || explicitKind === 'blog-archive' || explicitKind === 'home-page') {
    return explicitKind;
  }
  const normalized = String(explicitKind || '').toLowerCase();
  const normalizedWords = normalized.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalizedWords === 'home' || normalizedWords.includes('home page') || normalizedWords.includes('homepage')) {
    return 'home-page';
  }
  if (normalized.includes('archive') || normalized.includes('loop') || normalized === 'list') {
    return 'blog-archive';
  }
  if (normalized.includes('single') || normalized === 'post' || normalized === 'blog') {
    return 'single-post';
  }
  return blocks.some((block) => canonicalType(block?.type) === 'Collection List')
    ? 'blog-archive'
    : 'single-post';
}

function bindingFromPlaceholder(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^\{([^{}]+)\}$/);
  if (!match) return null;
  return BINDING_PATHS.includes(match[1]) ? match[1] : null;
}

function normalizeStyles(styles, path, warnings) {
  if (!isObject(styles)) return undefined;
  const output = {};
  for (const [key, value] of Object.entries(styles)) {
    if (STYLE_PROPERTIES.includes(key) && ['string', 'number'].includes(typeof value)) {
      output[key] = value;
    } else {
      warnings.push({
        code: 'normalize.style_dropped',
        path: `${path}.styles.${key}`,
        message: `Unsupported style property "${key}" was dropped.`,
      });
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function normalizeBinding(block, content, path, warnings) {
  const explicit = block?.bindings?.content;
  if (explicit && BINDING_PATHS.includes(explicit)) return explicit;
  if (explicit) {
    warnings.push({
      code: 'normalize.binding_dropped',
      path: `${path}.bindings.content`,
      message: `Unsupported binding "${explicit}" was dropped.`,
    });
  }
  const placeholder = bindingFromPlaceholder(content);
  if (placeholder) return placeholder;
  if (typeof content === 'string' && /^\{[^{}]+\}$/.test(content.trim())) {
    warnings.push({
      code: 'normalize.placeholder_unknown',
      path: `${path}.content`,
      message: `Unknown binding placeholder "${content.trim()}" was preserved as static content.`,
    });
  }
  return null;
}

function defaultContent(type) {
  switch (type) {
    case 'Divider':
    case 'Container': return '';
    case 'Button': return { text: 'Learn more', url: '#' };
    case 'Columns': return 2;
    case 'Collection List': return { limit: 6, category: '' };
    case 'Featured Carousel': return { limit: 3 };
    case 'Newsletter': return { title: 'Subscribe', description: 'Get the latest posts.', buttonText: 'Subscribe', placeholder: 'you@example.com' };
    case 'Social Links': return { links: [] };
    case 'Spacer': return '40px';
    case 'Code Block': return { code: '', language: 'text' };
    default: return '';
  }
}

function normalizeContent(type, content, source, path, warnings) {
  const value = content === undefined ? defaultContent(type) : clone(content);
  switch (type) {
    case 'Heading':
    case 'Paragraph':
    case 'Quote':
      return isObject(value) || typeof value === 'string' ? value : String(value ?? '');
    case 'Image':
      if (isObject(value)) return { src: String(value.src || value.url || ''), ...(value.alt ? { alt: String(value.alt) } : {}) };
      return String(value || source.image || '');
    case 'Divider':
    case 'Container': return '';
    case 'Button':
      if (isObject(value)) return { text: String(value.text || value.label || 'Learn more'), url: String(value.url || value.href || '#') };
      return { text: String(value || 'Learn more'), url: '#' };
    case 'Columns': {
      const columns = Number(isObject(value) ? value.columns : value);
      return Number.isInteger(columns) && columns >= 1 && columns <= 4 ? columns : 2;
    }
    case 'Collection List': {
      const limit = Number(isObject(value) ? value.limit : 6);
      return { limit: Number.isInteger(limit) ? Math.min(50, Math.max(1, limit)) : 6, category: String(isObject(value) ? value.category || '' : '') };
    }
    case 'Featured Carousel': {
      const limit = Number(isObject(value) ? value.limit : 3);
      return { limit: Number.isInteger(limit) ? Math.min(20, Math.max(1, limit)) : 3 };
    }
    case 'Video':
      return isObject(value) ? { url: String(value.url || ''), ...(value.title ? { title: String(value.title) } : {}) } : String(value || '');
    case 'Newsletter':
      return {
        title: String(isObject(value) ? value.title || source.title || 'Subscribe' : source.title || 'Subscribe'),
        description: String(isObject(value) ? value.description || value.excerpt || source.excerpt || 'Get the latest posts.' : source.excerpt || 'Get the latest posts.'),
        buttonText: String(isObject(value) ? value.buttonText || 'Subscribe' : 'Subscribe'),
        placeholder: String(isObject(value) ? value.placeholder || 'you@example.com' : 'you@example.com'),
      };
    case 'Social Links': {
      const rawLinks = Array.isArray(value) ? value : isObject(value) && Array.isArray(value.links) ? value.links : [];
      return {
        links: rawLinks.map((link) => isObject(link)
          ? { name: String(link.name || link.label || 'Link'), url: String(link.url || link.href || '#') }
          : { name: String(link), url: '#' }),
      };
    }
    case 'Spacer': return isObject(value) ? { height: value.height ?? '40px' } : value;
    case 'Code Block':
      return isObject(value) ? { code: String(value.code || ''), language: String(value.language || 'text') } : { code: String(value || ''), language: 'text' };
    case 'Html':
      return isObject(value) ? { html: String(value.html || value.code || '') } : String(value || '');
    case 'Markdown':
      return isObject(value) ? { markdown: String(value.markdown || value.text || '') } : String(value || '');
    default:
      warnings.push({ code: 'normalize.content_unknown', path: `${path}.content`, message: `Content for ${type} could not be normalized.` });
      return value;
  }
}

function normalizeCanonicalBlock(block, index, warnings) {
  const path = `$.blocks[${index}]`;
  const type = canonicalType(block?.type);
  if (!type) return expandLegacyPresentationBlock(block, index, warnings);
  const id = slug(block.id, `block-${index + 1}`);
  const content = normalizeContent(type, block.content, block, path, warnings);
  const binding = normalizeBinding(block, block.content, path, warnings);
  const normalized = { id, type, content };
  if (block.parentId) normalized.parentId = slug(block.parentId, String(block.parentId));
  const styles = normalizeStyles(block.styles || block.props?.styles, path, warnings);
  if (styles) normalized.styles = styles;
  if (binding) {
    normalized.bindings = { content: binding };
    if (typeof normalized.content === 'string' && bindingFromPlaceholder(normalized.content)) normalized.content = '';
  }
  const level = block.level ?? (isObject(block.content) ? block.content.level : undefined);
  if (type === 'Heading' && [1, 2, 3].includes(Number(level))) normalized.level = Number(level);
  return [normalized];
}

function expandLegacyPresentationBlock(block, index, warnings) {
  const path = `$.blocks[${index}]`;
  const legacyType = String(block?.type || '').toLowerCase();
  const supported = ['hero', 'hero-section', 'banner', 'featured', 'card'];
  if (!supported.includes(legacyType)) {
    warnings.push({
      code: 'normalize.block_unsupported',
      path: `${path}.type`,
      message: `Unsupported block type "${String(block?.type)}" was converted to a Paragraph for review.`,
    });
    return [{
      id: slug(block?.id, `block-${index + 1}`),
      type: 'Paragraph',
      content: String(block?.content || block?.excerpt || block?.title || ''),
    }];
  }

  const baseId = slug(block.id, `legacy-${index + 1}`);
  const container = { id: baseId, type: 'Container', content: '' };
  const blocks = [container];
  if (block.title || block.props?.title) {
    const titleValue = block.title || block.props.title;
    const binding = bindingFromPlaceholder(titleValue);
    blocks.push({
      id: `${baseId}-title`,
      type: 'Heading',
      content: binding ? '' : String(titleValue),
      parentId: baseId,
      level: 1,
      ...(binding ? { bindings: { content: binding } } : {}),
    });
  }
  const imageValue = block.image || block.props?.image;
  if (imageValue) {
    const binding = bindingFromPlaceholder(imageValue);
    blocks.push({
      id: `${baseId}-image`,
      type: 'Image',
      content: binding ? '' : String(imageValue),
      parentId: baseId,
      ...(binding ? { bindings: { content: binding } } : {}),
    });
  }
  const bodyValue = block.excerpt || block.props?.content;
  if (bodyValue) {
    const binding = bindingFromPlaceholder(bodyValue);
    blocks.push({
      id: `${baseId}-content`,
      type: 'Paragraph',
      content: binding ? '' : String(bodyValue),
      parentId: baseId,
      ...(binding ? { bindings: { content: binding } } : {}),
    });
  }
  warnings.push({
    code: 'normalize.legacy_block_expanded',
    path,
    message: `Legacy ${block.type} block was expanded into canonical blocks.`,
  });
  return blocks;
}

function normalizeLegacySections(sections, warnings) {
  return sections.flatMap((section, index) => {
    const props = isObject(section?.props) ? section.props : {};
    const synthetic = {
      ...section,
      content: props.content ?? section.content,
      styles: props.styles ?? section.styles,
    };
    const type = String(section?.type || '').toLowerCase();
    if (type === 'hero-section' || type === 'hero') {
      return expandLegacyPresentationBlock({ ...synthetic, title: props.title, image: props.image, excerpt: props.content }, index, warnings);
    }
    if (type === 'rich-text') synthetic.type = 'Paragraph';
    if (type === 'blog_loop' || type === 'blog-loop') {
      synthetic.type = 'Collection List';
      synthetic.content = props.query || props.content || { limit: 6, category: '' };
    }
    return normalizeCanonicalBlock(synthetic, index, warnings);
  });
}

function normalizeLayoutDocumentV1(input, options = {}) {
  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      const error = new Error('Layout input is not valid JSON.');
      error.name = 'LayoutNormalizationError';
      throw error;
    }
  }
  if (!Array.isArray(parsed) && !isObject(parsed)) {
    const error = new Error('Layout input must be a block array or layout object.');
    error.name = 'LayoutNormalizationError';
    throw error;
  }

  if (isObject(parsed) && parsed.schemaVersion === '1.0' && Array.isArray(parsed.blocks)) {
    return { document: clone(parsed), warnings: [], sourceFormat: 'layout-document-v1' };
  }

  const warnings = [];
  let sourceBlocks;
  let sourceFormat;
  if (Array.isArray(parsed)) {
    sourceBlocks = parsed;
    sourceFormat = 'block-array';
  } else if (Array.isArray(parsed.blocks)) {
    sourceBlocks = parsed.blocks;
    sourceFormat = 'blocks-object';
  } else if (Array.isArray(parsed.sections)) {
    sourceBlocks = parsed.sections;
    sourceFormat = 'legacy-sections';
  } else if (isObject(parsed.generated_layout) && Array.isArray(parsed.generated_layout.blocks)) {
    sourceBlocks = parsed.generated_layout.blocks;
    sourceFormat = 'ai-history';
  } else {
    const error = new Error('Layout object does not contain blocks, sections, or generated_layout.blocks.');
    error.name = 'LayoutNormalizationError';
    throw error;
  }

  const blocks = sourceFormat === 'legacy-sections'
    ? normalizeLegacySections(sourceBlocks, warnings)
    : sourceBlocks.flatMap((block, index) => normalizeCanonicalBlock(block, index, warnings));
  const explicitKind = options.kind || parsed.kind || parsed.type || parsed.layout_type;
  const kind = inferKind(blocks, explicitKind);
  const name = String(options.name || parsed.name || parsed.templateName || 'Migrated Layout').trim() || 'Migrated Layout';

  return {
    sourceFormat,
    warnings,
    document: {
      schemaVersion: '1.0',
      kind,
      name,
      blocks,
      metadata: {
        ...(options.description ? { description: String(options.description) } : {}),
        ...(options.designStyle || parsed.design_style ? { designStyle: String(options.designStyle || parsed.design_style) } : {}),
        origin: options.origin || (sourceFormat === 'ai-history' ? 'ai' : 'migrated'),
      },
    },
  };
}

module.exports = {
  TYPE_ALIASES,
  bindingFromPlaceholder,
  normalizeLayoutDocumentV1,
};
