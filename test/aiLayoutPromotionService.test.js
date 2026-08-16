const assert = require('node:assert/strict');
const test = require('node:test');

const { promoteAiLayout } = require('../src/services/aiLayoutPromotionService');
const validSingle = require('../../contracts/fixtures/valid-single-post.json');
const validHome = require('../../contracts/fixtures/valid-home-page.json');

function createPromotionPrisma(history) {
  const calls = [];
  const templates = new Map();
  const prisma = {
    calls,
    ai_layouts: {
      async findFirst(args) {
        calls.push({ model: 'ai_layouts', operation: 'findFirst', args });
        if (!history) return null;
        const where = args.where;
        return history.id === where.id && history.user_id === where.user_id && history.site_id === where.site_id
          ? history
          : null;
      },
    },
    templates: {
      async findFirst(args) {
        calls.push({ model: 'templates', operation: 'findFirst', args });
        return templates.get(args.where.id) || null;
      },
    },
    async $transaction(callback) {
      const tx = {
        templates: {
          async create(args) {
            calls.push({ model: 'templates', operation: 'create', args });
            const created = { id: 91, ...args.data };
            templates.set(created.id, created);
            return created;
          },
        },
        ai_layouts: {
          async update(args) {
            calls.push({ model: 'ai_layouts', operation: 'update', args });
            history.promoted_template_id = args.data.promoted_template_id;
            return history;
          },
        },
      };
      return callback(tx);
    },
  };
  return prisma;
}

test('promotes a site-owned AI layout into a site-scoped draft template', async () => {
  const history = {
    id: 12,
    user_id: 4,
    site_id: 8,
    layout_type: 'single-post',
    generated_layout: validSingle,
    promoted_template_id: null,
  };
  const prisma = createPromotionPrisma(history);
  const result = await promoteAiLayout({ prisma, historyId: 12, userId: 4, siteId: 8, name: 'AI Editorial' });

  assert.equal(result.alreadyPromoted, false);
  assert.equal(result.template.status, 'draft');
  assert.equal(result.template.siteId, 8);
  assert.equal(result.template.layoutJson.metadata.origin, 'ai');
  assert.equal(history.promoted_template_id, 91);
});

test('promotion is idempotent after history is linked to a template', async () => {
  const history = {
    id: 12,
    user_id: 4,
    site_id: 8,
    layout_type: 'single-post',
    generated_layout: validSingle,
    promoted_template_id: null,
  };
  const prisma = createPromotionPrisma(history);
  const first = await promoteAiLayout({ prisma, historyId: 12, userId: 4, siteId: 8 });
  const second = await promoteAiLayout({ prisma, historyId: 12, userId: 4, siteId: 8 });

  assert.equal(first.template.id, second.template.id);
  assert.equal(second.alreadyPromoted, true);
  assert.equal(prisma.calls.filter((call) => call.operation === 'create').length, 1);
});

test('promotes an AI Home Page into a Home Page draft template', async () => {
  const history = {
    id: 18,
    user_id: 4,
    site_id: 8,
    layout_type: 'home-page',
    generated_layout: validHome,
    promoted_template_id: null,
  };
  const prisma = createPromotionPrisma(history);
  const result = await promoteAiLayout({ prisma, historyId: 18, userId: 4, siteId: 8 });

  assert.equal(result.template.type, 'Home Page');
  assert.equal(result.template.layoutJson.kind, 'home-page');
  assert.equal(result.template.status, 'draft');
});

test('rejects cross-site and cross-user promotion attempts', async () => {
  const history = { id: 12, user_id: 4, site_id: 8, layout_type: 'single-post', generated_layout: validSingle };
  const prisma = createPromotionPrisma(history);

  await assert.rejects(
    () => promoteAiLayout({ prisma, historyId: 12, userId: 4, siteId: 9 }),
    (error) => error.statusCode === 404,
  );
  await assert.rejects(
    () => promoteAiLayout({ prisma, historyId: 12, userId: 5, siteId: 8 }),
    (error) => error.statusCode === 404,
  );
});

test('rejects invalid history IDs and malformed generated layouts', async () => {
  const history = { id: 12, user_id: 4, site_id: 8, layout_type: 'single-post', generated_layout: { bad: true } };
  const prisma = createPromotionPrisma(history);

  await assert.rejects(
    () => promoteAiLayout({ prisma, historyId: 'bad', userId: 4, siteId: 8 }),
    (error) => error.statusCode === 400,
  );
  await assert.rejects(
    () => promoteAiLayout({ prisma, historyId: 12, userId: 4, siteId: 8 }),
    (error) => error.name === 'LayoutNormalizationError',
  );
});
