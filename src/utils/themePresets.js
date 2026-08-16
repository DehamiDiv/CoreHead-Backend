const DEFAULT_PRESET = {
  id: 'theme-1',
  name: 'Default Classic Theme',
  colours: {
    primary: "#2563eb",
    background: "#f8fafc",
    foreground: "#0f172a",
    accent: "#3b82f6",
    card: "#ffffff",
    cardForeground: "#0f172a",
    muted: "#64748b",
  },
  header: {
    headerBg: "#ffffff",
    headerFont: "#0f172a",
    ctaBg: "#2563eb",
    ctaColor: "#ffffff",
  },
  footer: { footerBg: "#0f172a", footerFont: "#94a3b8" },
  font: "dm-sans",
  tokens: {},
  recommendedHomeStyle: 'classic'
};

const THEME_REGISTRY = {
  'theme-1': DEFAULT_PRESET,
  'default': DEFAULT_PRESET,
};

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

const getPreset = (themeId) => THEME_REGISTRY[themeId] || DEFAULT_PRESET;

function normalizeHomeStyle(homeStyle) {
  return homeStyle || 'classic';
}

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
