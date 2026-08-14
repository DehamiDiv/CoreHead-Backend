const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/models/prismaClient');
const posts = [];
let nextId = 1;

function live(post) {
  return post.isPublished === true || String(post.status).toLowerCase() === 'published';
}

function matchesWhere(post, where = {}) {
  if (where.id !== undefined && post.id !== where.id) return false;
  if (where.siteId !== undefined && post.siteId !== where.siteId) return false;
  if (where.slug !== undefined && post.slug !== where.slug) return false;
  if (where.OR && !live(post)) return false;
  return true;
}

const prisma = {
  site: {
    async findUnique({ where }) {
      return { id: where.id, status: 'active', name: `Site ${where.id}` };
    },
  },
  post: {
    async create({ data }) {
      const post = {
        id: nextId++,
        createdAt: new Date(),
        ...data,
        author: { id: data.authorId, name: 'Author', email: 'author@example.test' },
      };
      posts.push(post);
      return post;
    },
    async findFirst({ where }) {
      return posts.find((post) => matchesWhere(post, where)) || null;
    },
    async update({ where, data }) {
      const post = posts.find((candidate) => candidate.id === where.id);
      if (!post) return null;
      Object.assign(post, data);
      return post;
    },
    async findMany({ where, take }) {
      return posts.filter((post) => matchesWhere(post, where)).slice(0, take);
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
const previewController = require('../src/controllers/previewController');

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

test('site-owned post completes draft, publish, public resolve, archive, and unpublish lifecycle', async () => {
  posts.length = 0;
  nextId = 1;
  const actor = { id: 31, role: 'user' };

  const createRes = responseRecorder();
  await postController.createPost(
    {
      siteId: 7,
      siteRole: 'OWNER',
      user: actor,
      body: {
        title: 'Public workflow',
        slug: 'public-workflow',
        content: '<p>Complete article</p>',
        status: 'Draft',
      },
    },
    createRes,
  );
  assert.equal(createRes.statusCode, 201);
  assert.equal(createRes.body.siteId, 7);
  assert.equal(createRes.body.isPublished, false);

  const hiddenDraft = responseRecorder();
  await postController.getPostBySlug(
    { siteId: 7, params: { slug: 'public-workflow' } },
    hiddenDraft,
  );
  assert.equal(hiddenDraft.statusCode, 404);

  const publishRes = responseRecorder();
  await postController.publishPost(
    {
      siteId: 7,
      siteRole: 'OWNER',
      user: actor,
      params: { id: String(createRes.body.id) },
    },
    publishRes,
  );
  assert.equal(publishRes.statusCode, 200);
  assert.equal(publishRes.body.post.status, 'Published');
  assert.equal(publishRes.body.post.isPublished, true);

  const publicPost = responseRecorder();
  await postController.getPostBySlug(
    { siteId: 7, params: { slug: 'public-workflow' } },
    publicPost,
  );
  assert.equal(publicPost.statusCode, 200);
  assert.equal(publicPost.body.siteId, 7);

  const siteArchive = responseRecorder();
  await previewController.getPreviewPosts(
    { query: { siteId: '7', limit: '12' }, headers: {} },
    siteArchive,
  );
  assert.deepEqual(siteArchive.body.posts.map((post) => post.slug), ['public-workflow']);

  const otherSiteArchive = responseRecorder();
  await previewController.getPreviewPosts(
    { query: { siteId: '8', limit: '12' }, headers: {} },
    otherSiteArchive,
  );
  assert.deepEqual(otherSiteArchive.body.posts, []);

  const unpublishRes = responseRecorder();
  await postController.unpublishPost(
    {
      siteId: 7,
      siteRole: 'OWNER',
      user: actor,
      params: { id: String(createRes.body.id) },
      body: { status: 'Draft' },
    },
    unpublishRes,
  );
  assert.equal(unpublishRes.statusCode, 200);
  assert.equal(unpublishRes.body.post.isPublished, false);

  const hiddenAgain = responseRecorder();
  await postController.getPostBySlug(
    { siteId: 7, params: { slug: 'public-workflow' } },
    hiddenAgain,
  );
  assert.equal(hiddenAgain.statusCode, 404);
});
