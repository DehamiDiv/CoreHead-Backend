const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/models/prismaClient');
const calls = [];
let siteResult = { id: 4, status: 'active' };
let postResults = [];

const prisma = {
  site: {
    async findUnique(args) {
      calls.push({ model: 'site', operation: 'findUnique', args });
      return siteResult;
    },
  },
  post: {
    async findMany(args) {
      calls.push({ model: 'post', operation: 'findMany', args });
      return postResults;
    },
  },
};

require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prisma,
};

const { getPreviewPosts } = require('../src/controllers/previewController');

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
  siteResult = { id: 4, status: 'active' };
  postResults = [];
}

test('archive preview rejects requests without a site context', async () => {
  reset();
  const res = responseRecorder();
  await getPreviewPosts({ query: {}, headers: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.posts, []);
  assert.equal(calls.length, 0);
});

test('archive preview queries only live posts for the requested active site', async () => {
  reset();
  postResults = [
    { id: 1, siteId: 4, status: 'Published', isPublished: true, coverImage: '/one.jpg' },
    // Defense-in-depth filter protects against an inconsistent database/mock result.
    { id: 2, siteId: 4, status: 'Draft', isPublished: false, coverImage: null },
  ];
  const res = responseRecorder();

  await getPreviewPosts(
    { query: { siteId: '4', limit: '500' }, headers: {} },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.posts.length, 1);
  assert.equal(res.body.posts[0].id, 1);

  const query = calls.find((call) => call.model === 'post').args;
  assert.equal(query.where.siteId, 4);
  assert.equal(query.take, 100);
  assert.deepEqual(query.where.OR, [
    { status: { in: ['Published', 'published'] } },
    { isPublished: true },
  ]);
});

test('archive preview hides missing or inactive sites before querying posts', async () => {
  reset();
  siteResult = { id: 4, status: 'suspended' };
  const res = responseRecorder();
  await getPreviewPosts({ query: { siteId: '4' }, headers: {} }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.some((call) => call.model === 'post'), false);
});

test('legacy blog preview route uses the same tenant-scoped controller', () => {
  const fs = require('node:fs');
  const routeSource = fs.readFileSync(
    require.resolve('../src/routes/blogRoutes'),
    'utf8',
  );
  assert.match(
    routeSource,
    /router\.get\('\/posts\/preview', previewController\.getPreviewPosts\)/,
  );
});
