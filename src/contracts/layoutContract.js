const LAYOUT_SCHEMA_VERSION = '1.0';
const LAYOUT_KINDS = Object.freeze(['single-post', 'blog-archive', 'home-page']);
const LAYOUT_BLOCK_TYPES = Object.freeze([
  'Heading',
  'Paragraph',
  'Image',
  'Quote',
  'Divider',
  'Button',
  'Container',
  'Columns',
  'Collection List',
  'Featured Carousel',
  'Video',
  'Newsletter',
  'Social Links',
  'Spacer',
  'Code Block',
  'Html',
  'Markdown',
]);
const LAYOUT_BINDING_PATHS = Object.freeze([
  'post.title',
  'post.excerpt',
  'post.content',
  'post.contentHtml',
  'post.contentText',
  'post.coverImage',
  'post.featured_image',
  'post.category',
  'post.slug',
  'post.author.name',
  'post.publishedAt',
  'site.name',
  'site.slug',
  'site.logo',
  'site.description',
  'site.tagline',
  'site.heroImage',
]);

// Self-contained fallback JSON schema for layout documents
const layoutDocumentV1Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "LayoutDocumentV1",
  type: "object",
  required: ["version", "kind", "blocks"],
  properties: {
    version: { type: "string" },
    kind: { type: "string", enum: ["single-post", "blog-archive"] },
    blocks: { type: "array" }
  }
};

// Fallback validator that checks basic layout structure
function validateLayoutDocumentV1(document, options = {}) {
  const errors = [];
  const warnings = [];

  if (!document) {
    errors.push({ code: 'document.missing', path: '', message: 'Layout document is missing.' });
  } else {
    if (!document.blocks || !Array.isArray(document.blocks)) {
      errors.push({ code: 'document.blocks_invalid', path: '.blocks', message: 'Blocks must be an array.' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function assertValidLayoutDocumentV1(document) {
  const result = validateLayoutDocumentV1(document);
  if (!result.valid) {
    const error = new Error('Layout validation failed');
    error.name = 'LayoutValidationError';
    error.validationErrors = result.errors;
    throw error;
  }
}

function normalizeLayoutDocumentV1(layoutJson, options = {}) {
  let parsedJson = layoutJson;
  if (typeof layoutJson === "string") {
    try {
      parsedJson = JSON.parse(layoutJson);
    } catch (e) {
      parsedJson = {};
    }
  }

  const document = {
    version: parsedJson?.version || LAYOUT_SCHEMA_VERSION,
    kind: options.kind || parsedJson?.kind || 'single-post',
    name: options.name || parsedJson?.name || 'Untitled Layout',
    metadata: {
      origin: options.origin || parsedJson?.metadata?.origin || 'manual',
      ...(parsedJson?.metadata || {})
    },
    blocks: parsedJson?.blocks || []
  };

  return {
    document,
    sourceFormat: 'JSON',
    warnings: []
  };
}

module.exports = {
  LAYOUT_SCHEMA_VERSION,
  LAYOUT_KINDS,
  LAYOUT_BLOCK_TYPES,
  LAYOUT_BINDING_PATHS,
  layoutDocumentV1Schema,
  assertValidLayoutDocumentV1,
  normalizeLayoutDocumentV1,
  validateLayoutDocumentV1,
};
