const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertAssignableTemplate,
  kindToTemplateType,
  prepareTemplateLayout,
  templateTypeToKind,
} = require('../src/contracts/templateLayout');

test('maps legacy and canonical template type names', () => {
  assert.equal(templateTypeToKind('Single Post'), 'single-post');
  assert.equal(templateTypeToKind('Archive'), 'blog-archive');
  assert.equal(templateTypeToKind('blog-loop'), 'blog-archive');
  assert.equal(templateTypeToKind('Home Page'), 'home-page');
  assert.equal(templateTypeToKind('homepage'), 'home-page');
  assert.equal(templateTypeToKind('home_page'), 'home-page');
  assert.equal(templateTypeToKind('home-page'), 'home-page');
  assert.equal(kindToTemplateType('blog-archive'), 'Blog Archive');
  assert.equal(kindToTemplateType('home-page'), 'Home Page');
});

test('normalizes a legacy manual layout before persistence', () => {
  const prepared = prepareTemplateLayout({
    sections: [
      { type: 'hero-section', props: { title: '{post.title}', image: '{post.coverImage}' } },
      { type: 'rich-text', props: { content: '{post.contentHtml}' } },
    ],
  }, { name: 'Migrated Manual', type: 'Single Post', status: 'published' });

  assert.equal(prepared.layoutJson.schemaVersion, '1.0');
  assert.equal(prepared.layoutJson.kind, 'single-post');
  assert.equal(prepared.layoutJson.name, 'Migrated Manual');
  assert.ok(prepared.layoutJson.blocks.some((block) => block.bindings?.content === 'post.contentHtml'));
});

test('allows structurally valid drafts to omit semantic bindings', () => {
  const prepared = prepareTemplateLayout([
    { id: 'heading', type: 'Heading', content: 'Work in progress' },
  ], { name: 'Draft', type: 'Single Post', status: 'draft' });

  assert.equal(prepared.layoutJson.kind, 'single-post');
});

test('rejects publishing a Single Post without dynamic title and body', () => {
  assert.throws(
    () => prepareTemplateLayout([
      { id: 'heading', type: 'Heading', content: 'Static post' },
    ], { name: 'Invalid Published Post', type: 'Single Post', status: 'published' }),
    (error) => error.name === 'LayoutValidationError'
      && error.validationErrors.some((issue) => issue.code === 'semantic.single_post_content'),
  );
});

test('rejects publishing an archive without a collection', () => {
  assert.throws(
    () => prepareTemplateLayout([
      { id: 'heading', type: 'Heading', content: 'Static archive' },
    ], { name: 'Invalid Archive', type: 'Blog Archive', status: 'published' }),
    { name: 'LayoutValidationError' },
  );
});

test('persists a manual Home Page draft and enforces publication semantics', () => {
  const draft = prepareTemplateLayout([
    { id: 'heading', type: 'Heading', content: 'Work in progress' },
  ], { name: 'Custom Home', type: 'Home Page', status: 'draft' });
  assert.equal(draft.layoutJson.kind, 'home-page');

  const published = prepareTemplateLayout([
    { id: 'site-name', type: 'Heading', content: '', bindings: { content: 'site.name' } },
    { id: 'posts', type: 'Collection List', content: { limit: 6, category: '' } },
  ], { name: 'Custom Home', type: 'Home Page', status: 'published' });
  assert.equal(published.layoutJson.kind, 'home-page');
});

test('assignment accepts only published, semantically valid templates', () => {
  const valid = {
    name: 'Archive',
    type: 'Blog Archive',
    status: 'published',
    layoutJson: {
      blocks: [{ id: 'posts', type: 'Collection List', content: { limit: 6, category: '' } }],
    },
  };
  assert.doesNotThrow(() => assertAssignableTemplate(valid));
  assert.throws(() => assertAssignableTemplate({ ...valid, status: 'draft' }), /Only published/);
  assert.throws(
    () => assertAssignableTemplate({ ...valid, type: 'Single Post' }),
    (error) => error.name === 'LayoutValidationError',
  );
});
