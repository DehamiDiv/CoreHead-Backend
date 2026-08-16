const assert = require('node:assert/strict');
const test = require('node:test');

test('publishing validates, preserves history, and increments the template version', async () => {
  const repositoryPath = require.resolve('../src/repositories/templateRepository');
  const servicePath = require.resolve('../src/services/templateService');
  const calls = [];
  const template = {
    id: 14,
    siteId: 22,
    authorId: 7,
    name: 'Editorial Home',
    type: 'Home Page',
    status: 'draft',
    version: 3,
    layoutJson: {
      schemaVersion: '1.0',
      kind: 'home-page',
      name: 'Editorial Home',
      blocks: [
        { id: 'site-name', type: 'Heading', content: '', bindings: { content: 'site.name' } },
        { id: 'posts', type: 'Collection List', content: { limit: 6, category: '' } },
      ],
    },
  };
  const repository = {
    async getTemplateById() { return template; },
    async saveTemplateHistory(templateId, version, layoutJson, updatedBy) {
      calls.push({ operation: 'history', templateId, version, layoutJson, updatedBy });
    },
    async publishTemplate(id, layoutJson, version) {
      calls.push({ operation: 'publish', id, layoutJson, version });
      return { ...template, status: 'published', version, layoutJson };
    },
  };

  const previousRepository = require.cache[repositoryPath];
  require.cache[repositoryPath] = { id: repositoryPath, filename: repositoryPath, loaded: true, exports: repository };
  delete require.cache[servicePath];
  try {
    const service = require(servicePath);
    const result = await service.publishTemplate(14, 7, 'user', 22);

    assert.equal(result.status, 'published');
    assert.equal(result.version, 4);
    assert.deepEqual(calls.map((call) => call.operation), ['history', 'publish']);
    assert.equal(calls[0].version, 3);
    assert.equal(calls[1].layoutJson.kind, 'home-page');
  } finally {
    delete require.cache[servicePath];
    if (previousRepository) require.cache[repositoryPath] = previousRepository;
    else delete require.cache[repositoryPath];
  }
});
