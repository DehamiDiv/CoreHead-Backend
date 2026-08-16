const assert = require('node:assert/strict');
const test = require('node:test');

const {
  LAYOUT_SCHEMA_VERSION,
  LAYOUT_KINDS,
  LAYOUT_BLOCK_TYPES,
  LAYOUT_BINDING_PATHS,
  layoutDocumentV1Schema,
} = require('../src/contracts/layoutContract');
const validSingle = require('../../contracts/fixtures/valid-single-post.json');
const validArchive = require('../../contracts/fixtures/valid-blog-archive.json');
const validHome = require('../../contracts/fixtures/valid-home-page.json');
const invalidSingle = require('../../contracts/fixtures/invalid-single-post.json');

test('backend consumes the canonical LayoutDocument v1 contract', () => {
  assert.equal(LAYOUT_SCHEMA_VERSION, '1.0');
  assert.deepEqual(LAYOUT_KINDS, ['single-post', 'blog-archive', 'home-page']);
  assert.equal(LAYOUT_BLOCK_TYPES.length, 17);
  assert.ok(LAYOUT_BINDING_PATHS.includes('post.contentHtml'));
  assert.ok(LAYOUT_BINDING_PATHS.includes('site.tagline'));
  assert.equal(layoutDocumentV1Schema.properties.schemaVersion.const, '1.0');
});

test('valid contract fixtures contain the required semantic structures', () => {
  assert.ok(validSingle.blocks.some((block) => block.bindings?.content === 'post.title'));
  assert.ok(validSingle.blocks.some((block) => block.bindings?.content === 'post.contentHtml'));
  assert.ok(validArchive.blocks.some((block) => block.type === 'Collection List'));
  assert.equal(validHome.kind, 'home-page');
  assert.ok(validHome.blocks.some((block) => block.bindings?.content === 'site.name'));
});

test('invalid contract fixture is outside the structural and semantic contract', () => {
  assert.ok(invalidSingle.blocks.some((block) => !LAYOUT_BLOCK_TYPES.includes(block.type)));
  assert.ok(!invalidSingle.blocks.some((block) => block.bindings?.content === 'post.contentHtml'));
});
