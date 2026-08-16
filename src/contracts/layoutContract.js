const layoutDocumentV1Schema = require('./layout-document-v1.schema.json');
const {
  assertValidLayoutDocumentV1,
  validateLayoutDocumentV1,
} = require('./layout-validator-v1');
const { normalizeLayoutDocumentV1 } = require('./layout-normalizer-v1');

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
