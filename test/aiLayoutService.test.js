const assert = require('node:assert/strict');
const test = require('node:test');

const aiService = require('../src/services/aiService');
const { validateLayoutDocumentV1 } = require('../src/contracts/layoutContract');
const validSingle = require('../../contracts/fixtures/valid-single-post.json');
const validArchive = require('../../contracts/fixtures/valid-blog-archive.json');
const validHome = require('../../contracts/fixtures/valid-home-page.json');

function providerWithResponses(responses) {
  const calls = [];
  let index = 0;
  return {
    calls,
    chat: {
      completions: {
        async create(request) {
          calls.push(request);
          const response = responses[Math.min(index, responses.length - 1)];
          index += 1;
          return {
            choices: [{ message: { content: typeof response === 'string' ? response : JSON.stringify(response) } }],
          };
        },
      },
    },
  };
}

test('generates a validated Single Post using the canonical schema and requested kind', async () => {
  const client = providerWithResponses([validSingle]);
  const result = await aiService.generateLayout('Create an editorial technology article', {
    client,
    layoutType: 'single-post',
    designStyle: 'editorial',
  });

  assert.equal(result.isFallback, false);
  assert.equal(result.layout.kind, 'single-post');
  assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  assert.match(client.calls[0].messages[0].content, /LayoutDocument v1/);
  assert.match(client.calls[0].messages[0].content, /post\.contentHtml/);
});

test('repairs an invalid first response before returning the layout', async () => {
  const client = providerWithResponses([
    { schemaVersion: '1.0', kind: 'blog-archive', name: 'Broken', blocks: [{ id: 'title', type: 'Heading', content: 'Posts' }] },
    validArchive,
  ]);
  const result = await aiService.generateLayout('Create a magazine archive layout', {
    client,
    layoutType: 'blog-archive',
  });

  assert.equal(client.calls.length, 2);
  assert.equal(result.isFallback, false);
  assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  assert.match(client.calls[1].messages[1].content, /Validation errors/);
});

test('uses a valid kind-specific fallback after two invalid AI responses', async () => {
  const invalid = { blocks: [{ type: 'invented-widget', content: 'bad' }] };
  const client = providerWithResponses([invalid, invalid]);
  const result = await aiService.generateLayout('Create a clean single article layout', {
    client,
    layoutType: 'single-post',
  });

  assert.equal(result.isFallback, true);
  assert.equal(result.layout.kind, 'single-post');
  assert.ok(result.layout.blocks.some((block) => block.bindings?.content === 'post.title'));
  assert.ok(result.layout.blocks.some((block) => block.bindings?.content === 'post.contentHtml'));
  assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
});

test('rule-based archive fallback includes a valid collection without network access', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await aiService.generateLayout('Create a travel archive page', {
      layoutType: 'blog-archive',
      designStyle: 'magazine',
    });
    assert.equal(result.isFallback, true);
    assert.ok(result.layout.blocks.some((block) => block.type === 'Collection List'));
    assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('generates and repairs a canonical Home Page with site identity and posts', async () => {
  const invalidHome = {
    schemaVersion: '1.0',
    kind: 'home-page',
    name: 'Broken Home',
    blocks: [{ id: 'heading', type: 'Heading', content: 'Static home' }],
  };
  const client = providerWithResponses([invalidHome, validHome]);
  const result = await aiService.generateLayout('Create a professional publication home page', {
    client,
    layoutType: 'home-page',
    designStyle: 'editorial',
  });

  assert.equal(client.calls.length, 2);
  assert.equal(result.layout.kind, 'home-page');
  assert.ok(result.layout.blocks.some((block) => block.bindings?.content === 'site.name'));
  assert.ok(result.layout.blocks.some((block) => block.type === 'Collection List'));
  assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  assert.match(client.calls[0].messages[0].content, /site\.name/);
});

test('rule-based Home Page fallback is publishable without network access', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await aiService.generateLayout('Create a newsletter home page with subscribe', {
      layoutType: 'home-page',
    });
    assert.equal(result.isFallback, true);
    assert.equal(result.layout.kind, 'home-page');
    assert.ok(result.layout.blocks.some((block) => block.type === 'Newsletter'));
    assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('modification fallback stays on the canonical contract', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await aiService.modifyLayout(validSingle, 'add a call to action button');
    assert.equal(result.isFallback, true);
    assert.ok(result.blocks.some((block) => block.type === 'Button'));
    assert.ok(!result.blocks.some((block) => ['hero', 'banner', 'card'].includes(block.type)));
    assert.equal(validateLayoutDocumentV1(result.layout).valid, true);
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});
