const assert = require('node:assert/strict');
const test = require('node:test');

const {
  extractHomeStyle,
  normalizeHomeStyle,
} = require('../../contracts/appearance-model-v1');
const { mergeBranding } = require('../src/utils/themePresets');

test('backend normalizes canonical and legacy homepage layout IDs', () => {
  assert.equal(normalizeHomeStyle('bento'), 'bento');
  assert.equal(normalizeHomeStyle('editorial'), 'nature');
  assert.equal(normalizeHomeStyle('magazine'), 'paper');
  assert.equal(extractHomeStyle(JSON.stringify({ layout: 'minimal' })), 'glass');
});

test('explicit homepage selection wins independently of the active theme', () => {
  const branding = mergeBranding(
    'theme-6',
    { primary: '#123456' },
    null,
    null,
    null,
    'paper'
  );

  assert.equal(branding.themeId, 'theme-6');
  assert.equal(branding.colours.primary, '#123456');
  assert.equal(branding.homeStyle, 'paper');
});

test('sites without a stored homepage selection retain preset fallback compatibility', () => {
  assert.equal(mergeBranding('theme-4').homeStyle, 'bloom');
  assert.equal(mergeBranding('theme-11').homeStyle, 'glass');
});
