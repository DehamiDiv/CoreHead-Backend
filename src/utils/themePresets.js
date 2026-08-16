/** Shared Appearance theme registry and public branding resolver. */

const {
  THEME_REGISTRY,
  getThemeRegistration,
} = require('../../../contracts/appearance-registry-v1');
const { normalizeHomeStyle } = require('../../../contracts/appearance-model-v1');

const PRESETS = THEME_REGISTRY;

const DEFAULT_THEME_NAV_LINKS = [
  { id: 1, name: 'Home', link: '/' },
  { id: 2, name: 'Features', link: '#features' },
  { id: 3, name: 'Pricing', link: '/p/pricing' },
  { id: 4, name: 'Blogs', link: '/blog' },
  { id: 5, name: 'Guide', link: '/p/guide' },
  { id: 6, name: 'Dashboard', link: '/admin' },
  { id: 7, name: 'Logout', link: '/logout' },
];

const DEFAULT_THEME_FOOTER_LINKS = [
  { id: 1, name: 'Home', link: '/' },
  { id: 2, name: 'Blogs', link: '/blog' },
  { id: 3, name: 'Pricing', link: '/p/pricing' },
  { id: 4, name: 'Guide', link: '/p/guide' },
  { id: 5, name: 'Features', link: '#features' },
  { id: 6, name: 'Dashboard', link: '/admin' },
];

const getPreset = (themeId) => getThemeRegistration(themeId);

const mergeBranding = (
  themeId,
  colours,
  header,
  footer,
  font,
  homeStyleOverride
) => {
  const preset = getPreset(themeId);
  return {
    themeId: themeId || 'default',
    colours: { ...preset.colours, ...(colours || {}) },
    header: { ...preset.header, ...(header || {}) },
    footer: { ...preset.footer, ...(footer || {}) },
    font: font || preset.font,
    tokens: { ...preset.tokens },
    homeStyle: normalizeHomeStyle(
      homeStyleOverride || preset.recommendedHomeStyle || 'classic'
    ),
  };
};

module.exports = {
  PRESETS,
  getPreset,
  mergeBranding,
  DEFAULT_THEME_NAV_LINKS,
  DEFAULT_THEME_FOOTER_LINKS,
};
