const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/models/prismaClient');
const repositoryPath = require.resolve('../src/repositories/templateRepository');
const calls = [];

const prisma = {
  templates: {
    async findUnique(args) {
      calls.push({ operation: 'findUnique', args });
      return { id: args.where.id, type: 'Single Post', siteId: 7 };
    },
    async updateMany(args) {
      calls.push({ operation: 'updateMany', args });
      return { count: 1 };
    },
    async update(args) {
      calls.push({ operation: 'update', args });
      return { id: args.where.id, ...args.data };
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
