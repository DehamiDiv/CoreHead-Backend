/**
 * R2-4 — Theme presets (mirror of frontend lib/themePresets.ts).
 * Used when a site has active_theme but incomplete colour/header keys.
 */

const PRESETS = {
  default: {
    colours: {
      primary: '#2563eb',
      background: '#f8fafc',
      foreground: '#0f172a',
      accent: '#3b82f6',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#64748b',
    },
    header: {
      headerBg: '#ffffff',
      headerFont: '#0f172a',
      ctaBg: '#2563eb',
      ctaColor: '#ffffff',
      ctaText: 'Latest posts',
    },
    footer: {
      footerBg: '#0f172a',
      footerFont: '#94a3b8',
      footerDescription: 'Stories and updates from our team.',
    },
    font: 'dm-sans',
    homeStyle: 'classic',
  },
  'theme-1': {
    colours: {
      primary: '#166534',
      background: '#f0fdf4',
      foreground: '#14532d',
      accent: '#22c55e',
      card: '#ffffff',
      cardForeground: '#14532d',
      muted: '#4d7c5a',
    },
    header: {
      headerBg: '#14532d',
      headerFont: '#f0fdf4',
      ctaBg: '#22c55e',
      ctaColor: '#052e16',
      ctaText: 'Explore',
    },
    footer: {
      footerBg: '#052e16',
      footerFont: '#86efac',
      footerDescription: 'Inspired by nature and growth.',
    },
    font: 'dm-sans',
    homeStyle: 'nature',
  },
  'theme-2': {
    colours: {
      primary: '#ea580c',
      background: '#fff7ed',
      foreground: '#7c2d12',
      accent: '#f97316',
      card: '#ffffff',
      cardForeground: '#9a3412',
      muted: '#c2410c',
    },
    header: {
      headerBg: '#ffffff',
      headerFont: '#9a3412',
      ctaBg: '#ea580c',
      ctaColor: '#ffffff',
      ctaText: 'Featured',
    },
    footer: {
      footerBg: '#7c2d12',
      footerFont: '#fed7aa',
      footerDescription: 'Bold stories, bright ideas.',
    },
    font: 'inter',
    homeStyle: 'classic',
  },
  'theme-3': {
    colours: {
      primary: '#dc2626',
      background: '#fafafa',
      foreground: '#171717',
      accent: '#ef4444',
      card: '#ffffff',
      cardForeground: '#171717',
      muted: '#737373',
    },
    header: {
      headerBg: '#ffffff',
      headerFont: '#171717',
      ctaBg: '#dc2626',
      ctaColor: '#ffffff',
      ctaText: 'Read more',
    },
    footer: {
      footerBg: '#171717',
      footerFont: '#a3a3a3',
      footerDescription: 'Elegant editorial for modern readers.',
    },
    font: 'georgia',
    homeStyle: 'magazine',
  },
  'theme-4': {
    // Soft Bloom — calm meditation (lavender / mist, no green)
    colours: {
      primary: '#7B6B9A',
      background: '#F8F6FA',
      foreground: '#2C2835',
      accent: '#C4A882',
      card: '#FFFFFF',
      cardForeground: '#2C2835',
      muted: '#8A8496',
    },
    header: {
      headerBg: '#F8F6FA',
      headerFont: '#2C2835',
      ctaBg: '#7B6B9A',
      ctaColor: '#F8F6FA',
      ctaText: 'Start reading',
    },
    footer: {
      footerBg: '#2C2835',
      footerFont: '#D4CFE0',
      footerDescription:
        'A calm space for wellness, reflection, and stories that help you breathe.',
    },
    font: 'dm-sans',
    homeStyle: 'bloom',
  },
  'theme-5': {
    colours: {
      primary: '#0f766e',
      background: '#f0fdfa',
      foreground: '#134e4a',
      accent: '#14b8a6',
      card: '#ffffff',
      cardForeground: '#115e59',
      muted: '#0f766e',
    },
    header: {
      headerBg: '#134e4a',
      headerFont: '#ccfbf1',
      ctaBg: '#14b8a6',
      ctaColor: '#042f2e',
      ctaText: 'Stories',
    },
    footer: {
      footerBg: '#042f2e',
      footerFont: '#5eead4',
      footerDescription: 'Wanderlust and written journeys.',
    },
    font: 'ibm-plex',
    homeStyle: 'classic',
  },
  'theme-6': {
    colours: {
      primary: '#22c55e',
      background: '#0a0a0a',
      foreground: '#fafafa',
      accent: '#4ade80',
      card: '#171717',
      cardForeground: '#fafafa',
      muted: '#a3a3a3',
    },
    header: {
      headerBg: '#000000',
      headerFont: '#fafafa',
      ctaBg: '#22c55e',
      ctaColor: '#052e16',
      ctaText: 'Train hard',
    },
    footer: {
      footerBg: '#000000',
      footerFont: '#737373',
      footerDescription: 'Strength, discipline, results.',
    },
    font: 'inter',
    homeStyle: 'dark',
  },
  'theme-7': {
    colours: {
      primary: '#1d4ed8',
      background: '#eff6ff',
      foreground: '#1e3a8a',
      accent: '#3b82f6',
      card: '#ffffff',
      cardForeground: '#1e3a8a',
      muted: '#3b82f6',
    },
    header: {
      headerBg: '#ffffff',
      headerFont: '#1e3a8a',
      ctaBg: '#1d4ed8',
      ctaColor: '#ffffff',
      ctaText: 'About me',
    },
    footer: {
      footerBg: '#1e3a8a',
      footerFont: '#bfdbfe',
      footerDescription: 'Professional portfolio & insights.',
    },
    font: 'ibm-plex',
    homeStyle: 'minimal',
  },
  'theme-8': {
    colours: {
      primary: '#b91c1c',
      background: '#f8fafc',
      foreground: '#0f172a',
      accent: '#dc2626',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#64748b',
    },
    header: {
      headerBg: '#0f172a',
      headerFont: '#f8fafc',
      ctaBg: '#b91c1c',
      ctaColor: '#ffffff',
      ctaText: 'Contact',
    },
    footer: {
      footerBg: '#020617',
      footerFont: '#94a3b8',
      footerDescription: 'Consulting insights that scale.',
    },
    font: 'inter',
    homeStyle: 'classic',
  },
  'theme-9': {
    colours: {
      primary: '#0d9488',
      background: '#ffffff',
      foreground: '#134e4a',
      accent: '#2dd4bf',
      card: '#f0fdfa',
      cardForeground: '#115e59',
      muted: '#5eead4',
    },
    header: {
      headerBg: '#ffffff',
      headerFont: '#134e4a',
      ctaBg: '#0d9488',
      ctaColor: '#ffffff',
      ctaText: 'Categories',
    },
    footer: {
      footerBg: '#134e4a',
      footerFont: '#99f6e4',
      footerDescription: 'Clean editorial for curious minds.',
    },
    font: 'georgia',
    homeStyle: 'magazine',
  },
  'theme-10': {
    colours: {
      primary: '#0369a1',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      accent: '#0ea5e9',
      card: '#ffffff',
      cardForeground: '#075985',
      muted: '#0284c7',
    },
    header: {
      headerBg: '#0c4a6e',
      headerFont: '#e0f2fe',
      ctaBg: '#0ea5e9',
      ctaColor: '#082f49',
      ctaText: 'Magazine',
    },
    footer: {
      footerBg: '#082f49',
      footerFont: '#7dd3fc',
      footerDescription: 'News, culture, and long reads.',
    },
    font: 'dm-sans',
    homeStyle: 'magazine',
  },
  'theme-11': {
    colours: {
      primary: '#ef4444',
      background: '#09090b',
      foreground: '#fafafa',
      accent: '#f87171',
      card: '#18181b',
      cardForeground: '#fafafa',
      muted: '#a1a1aa',
    },
    header: {
      headerBg: '#09090b',
      headerFont: '#fafafa',
      ctaBg: '#ef4444',
      ctaColor: '#ffffff',
      ctaText: 'Get started',
    },
    footer: {
      footerBg: '#000000',
      footerFont: '#71717a',
      footerDescription: 'Modern dark experience.',
    },
    font: 'inter',
    homeStyle: 'dark',
  },
};

const getPreset = (themeId) => {
  const key = String(themeId || 'default');
  return PRESETS[key] || PRESETS.default;
};

/**
 * Tenant-scoped nav (matches frontend lib/themeNav.ts).
 * mapThemeNavHref on the public shell prefixes /s/{slug}/ for content links.
 */
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

/**
 * Merge DB branding fragments with preset defaults.
 * homeStyleOverride: optional site-level home layout from Appearance → home_layout
 * Layout only changes structure; colours stay from Appearance → Colours / Header / Footer.
 */
const mergeBranding = (themeId, colours, header, footer, font, homeStyleOverride) => {
  const preset = getPreset(themeId);
  const valid = new Set([
    'classic',
    'nature',
    'bloom',
    'portals',
    'bento',
    'studio',
    'paper',
    'glass',
    // legacy aliases
    'dark',
    'magazine',
    'minimal',
    'agents',
    'editorial',
  ]);
  let homeStyle = preset.homeStyle || 'classic';
  if (homeStyleOverride && valid.has(String(homeStyleOverride))) {
    homeStyle = String(homeStyleOverride);
  }
  // Normalize legacy / duplicate layouts → unique designs
  if (homeStyle === 'editorial') homeStyle = 'nature';
  if (homeStyle === 'agents') homeStyle = 'portals';
  if (homeStyle === 'dark') homeStyle = 'studio';
  if (homeStyle === 'magazine') homeStyle = 'paper';
  if (homeStyle === 'minimal') homeStyle = 'glass';
  return {
    themeId: themeId || 'default',
    colours: { ...preset.colours, ...(colours || {}) },
    header: { ...preset.header, ...(header || {}) },
    footer: { ...preset.footer, ...(footer || {}) },
    font: font || preset.font,
    homeStyle,
  };
};

module.exports = {
  PRESETS,
  getPreset,
  mergeBranding,
  DEFAULT_THEME_NAV_LINKS,
  DEFAULT_THEME_FOOTER_LINKS,
};
