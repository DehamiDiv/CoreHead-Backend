const assert = require('node:assert/strict');
const test = require('node:test');

const shared = require('../src/contracts/appearance-registry-v1');
const backend = require('../src/utils/themePresets');

test('backend consumes the shared theme registry without a duplicate preset table', () => {
  assert.equal(backend.PRESETS, shared.THEME_REGISTRY);
  assert.equal(backend.getPreset('theme-4').name, 'Lavender Calm');
  assert.equal(backend.getPreset('missing').id, 'default');
});

test('shared appearance registry satisfies its completeness contract', () => {
  assert.deepEqual(shared.validateAppearanceRegistry(), {
    valid: true,
    errors: [],
  });
});

test('backend branding exposes the complete shared structural token profile', () => {
  const branding = backend.mergeBranding('theme-3');
  assert.equal(branding.tokens.buttonStyle, 'square');
  assert.equal(branding.tokens.containerWidth, '78rem');
  assert.ok(branding.tokens.sectionSpacing);
});
