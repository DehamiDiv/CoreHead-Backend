const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/models/prismaClient');
const calls = [];
let findResult = null;
let createResult = null;
let templateResult = null;

const prisma = {
  post: {
    async create(args) {
      calls.push({ operation: 'create', args });
      return createResult || { id: 1, ...args.data };
    },
    async findFirst(args) {
      calls.push({ operation: 'findFirst', args });
      return findResult;
    },
    async update(args) {
      calls.push({ operation: 'update', args });
      return { id: args.where.id, ...args.data };
    },
    async delete(args) {
      calls.push({ operation: 'delete', args });
      return { id: args.where.id };
    },
  },
  templates: {
    async findFirst(args) {
      calls.push({ operation: 'findTemplate', args });
      return templateResult;
    },
  },
};

require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prisma,
};

const postController = require('../src/controllers/postController');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

function reset() {
  calls.length = 0;
  findResult = null;
  createResult = null;
  templateResult = null;
}

function validSinglePostTemplate(overrides = {}) {
  return {
    id: 22,
    siteId: 7,
    name: 'Editorial Reading',
    type: 'Single Post',
    status: 'published',
    layoutJson: {
      schemaVersion: '1.0',
      kind: 'single-post',
      name: 'Editorial Reading',
      blocks: [
        { id: 'title', type: 'Heading', content: '', bindings: { content: 'post.title' } },
        { id: 'body', type: 'Paragraph', content: '', bindings: { content: 'post.contentHtml' } },
      ],
      metadata: { origin: 'manual' },
    },
    ...overrides,
  };
}

test('post creation ignores a forged body siteId and persists the verified request site', async () => {
  reset();
  const req = {
    siteId: 7,
    siteRole: 'AUTHOR',
    user: { id: 31, role: 'user' },
    body: {
      title: 'Tenant safe post',
      slug: 'tenant-safe-post',
      content: '<p>Body</p>',
      status: 'Published',
      siteId: 999,
      authorId: 88,
    },
  };
  const res = responseRecorder();

  await postController.createPost(req, res);

  assert.equal(res.statusCode, 201);
  const create = calls.find((call) => call.operation === 'create');
  assert.equal(create.args.data.siteId, 7);
  assert.equal(create.args.data.authorId, 31);
  assert.equal(create.args.data.status, 'Published');
  assert.equal(create.args.data.isPublished, true);
});

test('post creation accepts a published site-owned Single Post layout override', async () => {
  reset();
  templateResult = validSinglePostTemplate();
  const res = responseRecorder();

  await postController.createPost({
    siteId: 7,
    siteRole: 'AUTHOR',
    user: { id: 31, role: 'user' },
    body: {
      title: 'Designed post',
      slug: 'designed-post',
      content: '<p>Readable body</p>',
      layoutTemplateId: 22,
    },
  }, res);

  assert.equal(res.statusCode, 201);
  const templateLookup = calls.find((call) => call.operation === 'findTemplate');
  assert.deepEqual(templateLookup.args.where, { id: 22, siteId: 7 });
  const create = calls.find((call) => call.operation === 'create');
  assert.equal(create.args.data.layoutTemplateId, 22);
});

test('post creation rejects a layout outside the selected site', async () => {
  reset();
  templateResult = null;
  const res = responseRecorder();

  await postController.createPost({
    siteId: 7,
    siteRole: 'OWNER',
    user: { id: 31, role: 'user' },
    body: {
      title: 'Blocked post',
      slug: 'blocked-post',
      content: '<p>Body</p>',
      layoutTemplateId: 999,
    },
  }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.some((call) => call.operation === 'create'), false);
});

test('post creation rejects an archive template as a post override', async () => {
  reset();
  templateResult = validSinglePostTemplate({ type: 'Blog Archive' });
  const res = responseRecorder();

  await postController.createPost({
    siteId: 7,
    siteRole: 'OWNER',
    user: { id: 31, role: 'user' },
    body: {
      title: 'Wrong layout post',
      slug: 'wrong-layout-post',
      content: '<p>Body</p>',
      layoutTemplateId: 22,
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(calls.some((call) => call.operation === 'create'), false);
});

test('public single-post lookup requires an explicit site context', async () => {
  reset();
  const res = responseRecorder();

  await postController.getPostBySlug(
    { params: { slug: 'same-slug' }, siteId: null },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('public single-post lookup scopes slug and live state to the resolved site', async () => {
  reset();
  findResult = {
    id: 12,
    siteId: 7,
    slug: 'same-slug',
    title: 'Site seven post',
    status: 'Published',
    isPublished: true,
    author: { id: 31, name: 'Writer' },
  };
  const res = responseRecorder();

  await postController.getPostBySlug(
    { params: { slug: 'same-slug' }, siteId: 7 },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.siteId, 7);
  const lookup = calls.find((call) => call.operation === 'findFirst');
  assert.equal(lookup.args.where.slug, 'same-slug');
  assert.equal(lookup.args.where.siteId, 7);
  assert.deepEqual(lookup.args.where.OR, [
    { status: { in: ['Published', 'published'] } },
    { isPublished: true },
  ]);
});

test('public single-post lookup rejects a draft even if persistence returns it', async () => {
  reset();
  findResult = {
    id: 12,
    siteId: 7,
    slug: 'draft-post',
    status: 'Draft',
    isPublished: false,
  };
  const res = responseRecorder();

  await postController.getPostBySlug(
    { params: { slug: 'draft-post' }, siteId: 7 },
    res,
  );

  assert.equal(res.statusCode, 404);
});

test('post update persists SEO fields within the verified site boundary', async () => {
  reset();
  findResult = {
    id: 44,
    siteId: 7,
    authorId: 31,
    status: 'Draft',
    isPublished: false,
    publishedAt: null,
  };
  const res = responseRecorder();

  await postController.updatePost(
    {
      params: { id: '44' },
      siteId: 7,
      siteRole: 'AUTHOR',
      user: { id: 31, role: 'user' },
      body: {
        metaTitle: 'Search title',
        metaDescription: 'Search description',
        canonicalUrl: 'https://example.test/story',
        keywords: ['cms', 'publishing'],
        structuredData: { '@type': 'BlogPosting' },
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  const update = calls.find((call) => call.operation === 'update');
  assert.equal(update.args.data.metaTitle, 'Search title');
  assert.equal(update.args.data.metaDescription, 'Search description');
  assert.equal(update.args.data.canonicalUrl, 'https://example.test/story');
  assert.equal(update.args.data.keywords, 'cms,publishing');
  assert.equal(update.args.data.structuredData, '{"@type":"BlogPosting"}');
});

for (const [name, handler] of [
  ['update', postController.updatePost],
  ['publish', postController.publishPost],
  ['unpublish', postController.unpublishPost],
  ['delete', postController.deletePost],
]) {
  test(`cross-site ${name} returns not found and performs no write`, async () => {
    reset();
    const req = {
      params: { id: '44' },
      siteId: 7,
      siteRole: 'OWNER',
      user: { id: 31, role: 'user' },
      body: name === 'update' ? { title: 'Changed' } : {},
    };
    const res = responseRecorder();

    await handler(req, res);

    assert.equal(res.statusCode, 404);
    const lookup = calls.find((call) => call.operation === 'findFirst');
    assert.deepEqual(lookup.args.where, { id: 44, siteId: 7 });
    assert.equal(
      calls.some((call) => call.operation === 'update' || call.operation === 'delete'),
      false,
    );
  });
}

test('legacy blog creation route uses authentication and site membership middleware', async () => {
  const fs = require('node:fs');
  const routeSource = fs.readFileSync(
    require.resolve('../src/routes/blogRoutes'),
    'utf8',
  );

  assert.match(
    routeSource,
    /router\.post\('\/posts', authMiddleware, requireSite, postController\.createPost\)/,
  );
  assert.doesNotMatch(routeSource, /router\.post\('\/posts', blogController\.createPost\)/);
});

test('legacy blog single-post route uses the tenant-scoped public controller', () => {
  const fs = require('node:fs');
  const routeSource = fs.readFileSync(
    require.resolve('../src/routes/blogRoutes'),
    'utf8',
  );

  assert.match(
    routeSource,
    /router\.get\('\/posts\/:slug', optionalSite, postController\.getPostBySlug\)/,
  );
  assert.doesNotMatch(
    routeSource,
    /router\.get\('\/posts\/:slug', blogController\.getPostBySlug\)/,
  );
});
