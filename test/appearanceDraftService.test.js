const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyAppearanceDraft,
  prepareAppearanceDraft,
  saveAppearanceDraft,
} = require('../src/services/appearanceDraftService');

function fakePrisma() {
  const writes = [];
  const model = {
    setting: { async upsert(args) { writes.push(args); return args.create; } },
    async $transaction(callback) { return callback(model); },
  };
  return { model, writes };
}

test('appearance drafts normalize selections and reject unrelated setting keys', () => {
  const draft = prepareAppearanceDraft({
    themeId: 'theme-4',
    homeStyle: 'magazine',
    settings: { site_colours: { primary: '#123456' } },
  });
  assert.equal(draft.themeId, 'theme-4');
  assert.equal(draft.homeStyle, 'paper');
  assert.deepEqual(draft.settings.active_theme, { themeId: 'theme-4' });
  assert.throws(
    () => prepareAppearanceDraft({ settings: { billing_plan: 'free' } }),
    /not allowed/
  );
});

test('saving a draft writes only the non-public draft key', async () => {
  const { model, writes } = fakePrisma();
  await saveAppearanceDraft(model, 7, { themeId: 'theme-1', homeStyle: 'bento' });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].create.siteId, 7);
  assert.equal(writes[0].create.key, 'appearance_draft');
});

test('applying a draft commits live settings and applied state in one transaction', async () => {
  const { model, writes } = fakePrisma();
  await applyAppearanceDraft(model, 9, {
    themeId: 'theme-8',
    homeStyle: 'glass',
    settings: { site_font: { font: 'inter' } },
  });
  assert.deepEqual(
    writes.map((write) => write.create.key),
    ['site_font', 'active_theme', 'home_layout', 'appearance_draft']
  );
  assert.ok(writes.every((write) => write.create.siteId === 9));
});
