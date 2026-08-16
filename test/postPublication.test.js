const assert = require('node:assert/strict');
const test = require('node:test');

const {
  POST_STATUS,
  normalizePostStatus,
  isPublicPost,
  publicPostWhere,
  buildPostStatusFields,
} = require('../src/contracts/postPublication');

test('normalizes post status aliases used by create, edit, and legacy records', () => {
  assert.equal(normalizePostStatus('Published'), POST_STATUS.PUBLISHED);
  assert.equal(normalizePostStatus('published'), POST_STATUS.PUBLISHED);
  assert.equal(normalizePostStatus('live'), POST_STATUS.PUBLISHED);
  assert.equal(normalizePostStatus('private'), POST_STATUS.UNPUBLISHED);
  assert.equal(normalizePostStatus('unexpected'), POST_STATUS.DRAFT);
});

test('publishing synchronizes public fields and preserves first publication time', () => {
  const first = buildPostStatusFields('Published');
  assert.equal(first.status, POST_STATUS.PUBLISHED);
  assert.equal(first.isPublished, true);
  assert.ok(first.publishedAt instanceof Date);

  const republished = buildPostStatusFields('live', {
    previousPublishedAt: first.publishedAt,
  });
  assert.equal(republished.publishedAt, first.publishedAt);

  const draft = buildPostStatusFields('Draft', {
    previousPublishedAt: first.publishedAt,
  });
  assert.equal(draft.isPublished, false);
  assert.equal(draft.publishedAt, first.publishedAt);
});

test('public visibility accepts canonical and legacy live records but rejects drafts', () => {
  assert.equal(isPublicPost({ status: 'Published', isPublished: true }), true);
  assert.equal(isPublicPost({ status: 'published', isPublished: false }), true);
  assert.equal(isPublicPost({ status: 'Draft', isPublished: true }), true);
  assert.equal(isPublicPost({ status: 'Draft', isPublished: false }), false);
  assert.equal(isPublicPost({ status: 'Unpublished', isPublished: false }), false);
});

test('public query always scopes posts to one site and live publication state', () => {
  assert.deepEqual(publicPostWhere(17, { slug: 'hello-world' }), {
    slug: 'hello-world',
    siteId: 17,
    OR: [
      { status: { in: ['Published', 'published'] } },
      { isPublished: true },
    ],
  });
});
