const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeLayoutDocumentV1,
  validateLayoutDocumentV1,
} = require('../src/contracts/layoutContract');
const validSingle = require('../src/contracts/fixtures/valid-single-post.json');

test('returns an isolated clone for an existing LayoutDocument v1', () => {
  const result = normalizeLayoutDocumentV1(validSingle);
  assert.equal(result.sourceFormat, 'layout-document-v1');
  assert.deepEqual(result.document, validSingle);
  assert.notEqual(result.document, validSingle);
});

test('normalizes a raw block array deterministically and infers archive kind', () => {
  const input = [
    { type: 'heading', content: 'Stories' },
    { type: 'blog_loop', content: { limit: 8, category: 'tech' } },
  ];
  const first = normalizeLayoutDocumentV1(input, { name: 'Archive' });
  const second = normalizeLayoutDocumentV1(input, { name: 'Archive' });

  assert.deepEqual(first, second);
  assert.equal(first.document.kind, 'blog-archive');
  assert.deepEqual(first.document.blocks.map((block) => block.id), ['block-1', 'block-2']);
  assert.equal(validateLayoutDocumentV1(first.document).valid, true);
});

test('preserves an explicit Home Page kind and its site bindings', () => {
  const result = normalizeLayoutDocumentV1([
    { type: 'Heading', content: '{site.name}' },
    { type: 'Paragraph', content: '{site.tagline}' },
    { type: 'Collection List', content: { limit: 6, category: '' } },
  ], { kind: 'home-page', name: 'Home' });

  assert.equal(result.document.kind, 'home-page');
  assert.equal(result.document.blocks[0].bindings.content, 'site.name');
  assert.equal(result.document.blocks[1].bindings.content, 'site.tagline');
  assert.equal(validateLayoutDocumentV1(result.document).valid, true);
});

test('normalizes legacy Home Page type aliases without changing the canonical kind', () => {
  for (const type of ['Home Page', 'home_page', 'homepage', 'home-page']) {
    const result = normalizeLayoutDocumentV1([
      { id: 'site-name', type: 'Heading', content: '{site.name}' },
      { id: 'posts', type: 'Collection List', content: { limit: 6, category: '' } },
    ], { kind: type, name: 'Legacy Home' });
    assert.equal(result.document.kind, 'home-page');
    assert.equal(validateLayoutDocumentV1(result.document).valid, true);
  }
});

test('converts legacy sections without losing hero image or CMS bindings', () => {
  const legacy = {
    version: '1.0',
    type: 'Single Post',
    name: 'Legacy Post',
    sections: [
      { id: 'header', type: 'hero-section', props: { title: '{post.title}', image: '{post.coverImage}' } },
      { id: 'content', type: 'rich-text', props: { content: '{post.contentHtml}' } },
    ],
  };
  const result = normalizeLayoutDocumentV1(legacy);

  assert.equal(result.sourceFormat, 'legacy-sections');
  assert.ok(result.document.blocks.some((block) => block.type === 'Image' && block.bindings?.content === 'post.coverImage'));
  assert.ok(result.document.blocks.some((block) => block.bindings?.content === 'post.title'));
  assert.ok(result.document.blocks.some((block) => block.bindings?.content === 'post.contentHtml'));
  assert.equal(validateLayoutDocumentV1(result.document).valid, true);
});

test('normalizes AI history and legacy presentation blocks', () => {
  const history = {
    layout_type: 'single-post',
    generated_layout: {
      blocks: [
        { id: 'hero', type: 'hero', title: '{post.title}', image: '{post.coverImage}', excerpt: '{post.contentHtml}' },
      ],
    },
  };
  const result = normalizeLayoutDocumentV1(history, { name: 'Generated Post' });

  assert.equal(result.sourceFormat, 'ai-history');
  assert.equal(result.document.metadata.origin, 'ai');
  assert.ok(result.warnings.some((warning) => warning.code === 'normalize.legacy_block_expanded'));
  assert.equal(validateLayoutDocumentV1(result.document).valid, true);
});

test('drops unsupported styles with warnings and does not mutate input', () => {
  const input = [{ id: 'title', type: 'Heading', content: '{post.title}', styles: { fontSize: '40px', position: 'fixed' } }, { id: 'body', type: 'Paragraph', content: '{post.contentHtml}' }];
  const before = JSON.stringify(input);
  const result = normalizeLayoutDocumentV1(input, { kind: 'single-post' });

  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(result.document.blocks[0].styles, { fontSize: '40px' });
  assert.ok(result.warnings.some((warning) => warning.code === 'normalize.style_dropped'));
});

test('rejects malformed normalization input', () => {
  assert.throws(() => normalizeLayoutDocumentV1('{broken'), { name: 'LayoutNormalizationError' });
  assert.throws(() => normalizeLayoutDocumentV1({ name: 'No structure' }), { name: 'LayoutNormalizationError' });
});
