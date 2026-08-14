const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertValidLayoutDocumentV1,
  validateLayoutDocumentV1,
} = require('../src/contracts/layoutContract');
const validSingle = require('../../contracts/fixtures/valid-single-post.json');
const validArchive = require('../../contracts/fixtures/valid-blog-archive.json');
const invalidSingle = require('../../contracts/fixtures/invalid-single-post.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('validates canonical Single Post and Blog Archive fixtures', () => {
  assert.equal(validateLayoutDocumentV1(validSingle).valid, true);
  assert.equal(validateLayoutDocumentV1(validArchive).valid, true);
});

test('rejects unknown blocks and missing Single Post bindings', () => {
  const result = validateLayoutDocumentV1(invalidSingle);
  const codes = result.errors.map((error) => error.code);

  assert.equal(result.valid, false);
  assert.ok(codes.includes('block.unsupported_type'));
  assert.ok(codes.includes('semantic.single_post_title'));
  assert.ok(codes.includes('semantic.single_post_content'));
});

test('rejects duplicate IDs, missing parents, invalid styles, and invalid bindings', () => {
  const document = clone(validSingle);
  document.blocks[1].id = document.blocks[0].id;
  document.blocks[2].parentId = 'missing-container';
  document.blocks[2].styles = { position: 'fixed' };
  document.blocks[3].bindings.content = 'database.password';
  const result = validateLayoutDocumentV1(document);
  const codes = result.errors.map((error) => error.code);

  assert.ok(codes.includes('block.duplicate_id'));
  assert.ok(codes.includes('block.parent_missing'));
  assert.ok(codes.includes('block.style_unsupported'));
  assert.ok(codes.includes('block.binding_path'));
});

test('rejects parent cycles and non-container parents', () => {
  const document = clone(validArchive);
  document.blocks.unshift(
    { id: 'container-a', type: 'Container', content: '', parentId: 'container-b' },
    { id: 'container-b', type: 'Container', content: '', parentId: 'container-a' },
  );
  document.blocks.at(-1).parentId = 'archive-heading';
  const result = validateLayoutDocumentV1(document);
  const codes = result.errors.map((error) => error.code);

  assert.ok(codes.includes('block.parent_cycle'));
  assert.ok(codes.includes('block.parent_type'));
});

test('rejects unsafe HTML, URLs, styles, and invalid collection limits', () => {
  const document = clone(validArchive);
  document.blocks.push(
    { id: 'unsafe-html', type: 'Html', content: '<img src=x onerror=alert(1)>' },
    { id: 'unsafe-button', type: 'Button', content: { text: 'Run', url: 'javascript:alert(1)' } },
  );
  document.blocks[0].styles = { color: 'expression(alert(1))' };
  document.blocks[1].content.limit = 51;
  const result = validateLayoutDocumentV1(document);
  const codes = result.errors.map((error) => error.code);

  assert.ok(codes.includes('block.html_unsafe'));
  assert.ok(codes.includes('block.content_shape'));
  assert.ok(codes.includes('block.style_unsafe'));
});

test('does not mutate the document and provides an asserting API', () => {
  const document = clone(validSingle);
  const before = JSON.stringify(document);

  assert.doesNotThrow(() => assertValidLayoutDocumentV1(document));
  assert.equal(JSON.stringify(document), before);
  assert.throws(
    () => assertValidLayoutDocumentV1(invalidSingle),
    (error) => error.name === 'LayoutValidationError' && error.validationErrors.length > 0,
  );
});
