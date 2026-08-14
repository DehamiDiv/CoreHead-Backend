const assert = require('node:assert/strict');
const test = require('node:test');

const { validateLayoutJson } = require('../src/utils/layoutValidator');
const { createAiProviderMock, createPrismaMock } = require('./support/testDoubles');

test('backend unit-test harness loads application modules', () => {
  assert.equal(validateLayoutJson({ blocks: [] }), true);
});

test('backend AI provider test double requires no network access', async () => {
  const provider = createAiProviderMock({ blocks: [] });
  const response = await provider.generateLayout('Create an archive layout');

  assert.deepEqual(response, { blocks: [] });
  assert.deepEqual(provider.calls, ['Create an archive layout']);
});

test('backend Prisma test double records model operations', async () => {
  const prisma = createPrismaMock({ templates: { findMany: [{ id: 1 }] } });
  const templates = await prisma.templates.findMany({ where: { siteId: 2 } });

  assert.deepEqual(templates, [{ id: 1 }]);
  assert.deepEqual(prisma.calls[0], {
    model: 'templates',
    operation: 'findMany',
    args: { where: { siteId: 2 } },
  });
});
