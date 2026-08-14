const assert = require('node:assert/strict');
const test = require('node:test');

const aiService = require('../src/services/aiService');
const { promoteAiLayout } = require('../src/services/aiLayoutPromotionService');
const { assertAssignableTemplate } = require('../src/contracts/templateLayout');
const { prepareRenderableLayout } = require('../../contracts/renderable-layout-v1');
const validSingle = require('../../contracts/fixtures/valid-single-post.json');
const validArchive = require('../../contracts/fixtures/valid-blog-archive.json');

function provider(document) {
  return {
    chat: {
      completions: {
        async create() {
          return { choices: [{ message: { content: JSON.stringify(document) } }] };
        },
      },
    },
  };
}

function matches(value, condition) {
  if (condition === undefined) return true;
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.in) return condition.in.includes(value);
    if (condition.NOT) return value !== condition.NOT;
  }
  return value === condition;
}

function workflowPrisma(history) {
  const templates = [];
  let nextTemplateId = 1;
  const model = {
    ai_layouts: {
      async findFirst({ where }) {
        return history.id === where.id && history.user_id === where.user_id && history.site_id === where.site_id
          ? history
          : null;
      },
      async update({ data }) {
        Object.assign(history, data);
        return history;
      },
    },
    templates: {
      async create({ data }) {
        const template = { id: nextTemplateId++, version: 1, category: null, ...data };
        templates.push(template);
        return template;
      },
      async findUnique({ where }) {
        return templates.find((template) => template.id === where.id) || null;
      },
      async findFirst({ where }) {
        return templates.find((template) =>
          matches(template.id, where.id)
          && matches(template.siteId, where.siteId)
          && matches(template.type, where.type)
          && matches(template.status, where.status)
          && matches(template.category, where.category)) || null;
      },
      async update({ where, data }) {
        const template = templates.find((item) => item.id === where.id);
        Object.assign(template, data);
        return template;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const template of templates) {
          const excluded = where.NOT?.id === template.id;
          if (!excluded
            && matches(template.siteId, where.siteId)
            && matches(template.type, where.type)
            && matches(template.category, where.category)) {
            Object.assign(template, data);
            count += 1;
          }
        }
        return { count };
      },
    },
    templateHistory: { async create({ data }) { return data; } },
    async $transaction(callback) { return callback(model); },
  };
  return { prisma: model, templates };
}

async function runWorkflow(fixture, layoutType) {
  const generated = await aiService.generateLayout(`Generate ${layoutType}`, {
    client: provider(fixture),
    layoutType,
  });
  const history = {
    id: 41,
    user_id: 5,
    site_id: 9,
    layout_type: layoutType,
    generated_layout: generated.layout,
    promoted_template_id: null,
  };
  const { prisma } = workflowPrisma(history);
  const prismaModule = require.resolve('../src/models/prismaClient');
  const previousCache = require.cache[prismaModule];
  require.cache[prismaModule] = { id: prismaModule, filename: prismaModule, loaded: true, exports: prisma };
  const repositoryModule = require.resolve('../src/repositories/templateRepository');
  delete require.cache[repositoryModule];
  const repository = require('../src/repositories/templateRepository');

  try {
    const promoted = await promoteAiLayout({
      prisma,
      historyId: history.id,
      userId: history.user_id,
      siteId: history.site_id,
      name: generated.layout.name,
    });
    assert.equal(promoted.template.status, 'draft');

    const published = await repository.publishTemplate(promoted.template.id, promoted.template.layoutJson);
    assert.equal(published.status, 'published');
    assert.doesNotThrow(() => assertAssignableTemplate(published));

    await repository.assignTemplate(published.id, null, true, history.site_id);
    const resolved = await repository.resolveActiveLayout(published.type, null, history.site_id);
    assert.equal(resolved.id, published.id);
    assert.equal(resolved.category, 'global_default');

    const renderable = prepareRenderableLayout(resolved.layoutJson, {
      name: resolved.name,
      kind: generated.layout.kind,
      semantic: true,
    });
    assert.equal(renderable.valid, true);
    assert.deepEqual(renderable.document.blocks, generated.layout.blocks);

    const wrongSite = await repository.resolveActiveLayout(published.type, null, 999);
    assert.equal(wrongSite, null);
  } finally {
    delete require.cache[repositoryModule];
    if (previousCache) require.cache[prismaModule] = previousCache;
    else delete require.cache[prismaModule];
  }
}

test('AI Single Post completes generate, promote, publish, assign, resolve, and render preparation', async () => {
  await runWorkflow(validSingle, 'single-post');
});

test('AI Blog Archive completes generate, promote, publish, assign, resolve, and render preparation', async () => {
  await runWorkflow(validArchive, 'blog-archive');
});
