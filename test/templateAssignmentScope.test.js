const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/models/prismaClient');
const repositoryPath = require.resolve('../src/repositories/templateRepository');
const calls = [];
const findResults = [];
let targetType = 'Single Post';

const prisma = {
  templates: {
    async findUnique(args) {
      calls.push({ operation: 'findUnique', args });
      return { id: args.where.id, type: targetType, siteId: 7 };
    },
    async updateMany(args) {
      calls.push({ operation: 'updateMany', args });
      return { count: 1 };
    },
    async update(args) {
      calls.push({ operation: 'update', args });
      return { id: args.where.id, ...args.data };
    },
    async findFirst(args) {
      calls.push({ operation: 'findFirst', args });
      return findResults.shift() || null;
    },
  },
};

require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prisma,
};
delete require.cache[repositoryPath];

const templateRepository = require('../src/repositories/templateRepository');

test.beforeEach(() => {
  calls.length = 0;
  findResults.length = 0;
  targetType = 'Single Post';
});

test('Home Page assignment clears only previous Home Page defaults for the site', async () => {
  targetType = 'Home Page';
  await templateRepository.assignTemplate(55, null, true, 7);

  const clearPrevious = calls.find((call) => call.operation === 'updateMany');
  assert.equal(clearPrevious.args.where.siteId, 7);
  assert.ok(clearPrevious.args.where.type.in.includes('Home Page'));
  assert.ok(clearPrevious.args.where.type.in.includes('home-page'));
  assert.ok(!clearPrevious.args.where.type.in.includes('Single Post'));
  assert.ok(!clearPrevious.args.where.type.in.includes('Blog Archive'));
});

test('public Home Page resolution stays site-scoped and published-only', async () => {
  findResults.push({
    id: 55,
    siteId: 7,
    type: 'Home Page',
    status: 'published',
    category: 'global_default',
  });

  const resolved = await templateRepository.resolveActiveLayout('Home Page', null, 7);
  assert.equal(resolved.id, 55);
  const lookup = calls.find((call) => call.operation === 'findFirst');
  assert.equal(lookup.args.where.siteId, 7);
  assert.equal(lookup.args.where.category, 'global_default');
  assert.deepEqual(lookup.args.where.status, { in: ['published', 'Published'] });
  assert.ok(lookup.args.where.type.in.includes('Home Page'));
});

test('per-post layout override resolves before category and global assignments', async () => {
  findResults.push({
    id: 77,
    siteId: 7,
    type: 'Single Post',
    status: 'published',
  });

  const resolved = await templateRepository.resolveActiveLayout(
    'Single Post',
    'news',
    7,
    77,
  );

  assert.equal(resolved.id, 77);
  const lookup = calls.find((call) => call.operation === 'findFirst');
  assert.equal(lookup.args.where.id, 77);
  assert.equal(lookup.args.where.siteId, 7);
  assert.deepEqual(lookup.args.where.status, { in: ['published', 'Published'] });
  assert.ok(lookup.args.where.type.in.includes('Single Post'));
  assert.equal(calls.filter((call) => call.operation === 'findFirst').length, 1);
});

test('global content-layout selection replaces only the same site and kind family', async () => {
  await templateRepository.assignTemplate(42, null, true, 7);

  const clearPrevious = calls.find((call) => call.operation === 'updateMany');
  assert.equal(clearPrevious.args.where.siteId, 7);
  assert.equal(clearPrevious.args.where.category, 'global_default');
  assert.deepEqual(clearPrevious.args.where.NOT, { id: 42 });
  assert.ok(clearPrevious.args.where.type.in.includes('Single Post'));
  assert.ok(!clearPrevious.args.where.type.in.includes('Blog Archive'));

  const activate = calls.find((call) => call.operation === 'update');
  assert.deepEqual(activate.args.where, { id: 42 });
  assert.equal(activate.args.data.category, 'global_default');
  assert.equal(activate.args.data.status, 'published');
});
