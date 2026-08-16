const assert = require('node:assert/strict');
const test = require('node:test');

const { auditAndMigrateTemplates } = require('../src/services/layoutMigrationService');
const validArchive = require('../src/contracts/fixtures/valid-blog-archive.json');

function migrationPrisma(templates) {
  const writes = [];
  return {
    writes,
    templates: {
      async findMany(args) {
        const list = args.where?.siteId
          ? templates.filter((template) => template.siteId === args.where.siteId)
          : templates;
        return JSON.parse(JSON.stringify(list));
      },
    },
    async $transaction(callback) {
      return callback({
        templateHistory: {
          async create(args) {
            writes.push({ operation: 'history', args });
            return args.data;
          },
        },
        templates: {
          async update(args) {
            writes.push({ operation: 'update', args });
            const template = templates.find((item) => item.id === args.where.id);
            Object.assign(template, args.data);
            return template;
          },
        },
      });
    },
  };
}

function legacySingle(id = 1) {
  return {
    id,
    name: 'Legacy Single',
    type: 'Single Post',
    status: 'published',
    version: 2,
    authorId: 7,
    siteId: 4,
    layoutJson: {
      sections: [
        { id: 'hero', type: 'hero-section', props: { title: '{post.title}', image: '{post.coverImage}' } },
        { id: 'body', type: 'rich-text', props: { content: '{post.contentHtml}' } },
      ],
    },
  };
}

test('dry run reports migrations without writing data', async () => {
  const prisma = migrationPrisma([legacySingle()]);
  const report = await auditAndMigrateTemplates({ prisma, apply: false });

  assert.equal(report.mode, 'dry-run');
  assert.equal(report.migratable, 1);
  assert.equal(report.migrated, 0);
  assert.equal(prisma.writes.length, 0);
});

test('apply preserves history and increments the template version', async () => {
  const templates = [legacySingle()];
  const original = JSON.parse(JSON.stringify(templates[0].layoutJson));
  const prisma = migrationPrisma(templates);
  const report = await auditAndMigrateTemplates({ prisma, apply: true, siteId: 4 });

  assert.equal(report.migrated, 1);
  assert.equal(templates[0].version, 3);
  assert.equal(templates[0].layoutJson.schemaVersion, '1.0');
  assert.equal(templates[0].layoutJson.metadata.origin, 'migrated');
  assert.deepEqual(prisma.writes[0].args.data.layoutJson, original);
});

test('migration is idempotent after a successful conversion', async () => {
  const templates = [legacySingle()];
  const prisma = migrationPrisma(templates);
  await auditAndMigrateTemplates({ prisma, apply: true });
  const second = await auditAndMigrateTemplates({ prisma, apply: true });

  assert.equal(second.skipped, 1);
  assert.equal(second.migrated, 0);
  assert.equal(prisma.writes.filter((write) => write.operation === 'update').length, 1);
});

test('invalid published layouts are reported and never changed', async () => {
  const invalid = {
    ...legacySingle(2),
    layoutJson: [{ id: 'title', type: 'Heading', content: 'Static only' }],
  };
  const prisma = migrationPrisma([invalid]);
  const report = await auditAndMigrateTemplates({ prisma, apply: true });

  assert.equal(report.invalid, 1);
  assert.equal(prisma.writes.length, 0);
  assert.equal(invalid.layoutJson[0].content, 'Static only');
});

test('canonical valid layouts are skipped', async () => {
  const template = {
    id: 3,
    name: validArchive.name,
    type: 'Blog Archive',
    status: 'published',
    version: 1,
    authorId: 7,
    siteId: 4,
    layoutJson: validArchive,
  };
  const prisma = migrationPrisma([template]);
  const report = await auditAndMigrateTemplates({ prisma, apply: true });

  assert.equal(report.skipped, 1);
  assert.equal(prisma.writes.length, 0);
});
