'use strict';

const { HOME_LAYOUT_IDS, normalizeHomeStyle } = require('./appearance-model-v1');

function theme(id, name, colours, header, footer, font, recommendedHomeStyle) {
  const editorial = ['theme-3', 'theme-9', 'theme-10'].includes(id);
  const dark = ['theme-6', 'theme-11'].includes(id);
  return Object.freeze({
    id,
    name,
    colours: Object.freeze(colours),
    header: Object.freeze(header),
    footer: Object.freeze(footer),
    font,
    tokens: Object.freeze({
      radius: editorial ? '0.25rem' : dark ? '0.75rem' : '1rem',
      shadow: editorial ? 'none' : '0 18px 45px rgba(15, 23, 42, 0.12)',
      buttonStyle: editorial ? 'square' : 'pill',
      containerWidth: editorial ? '78rem' : '72rem',
      sectionSpacing: editorial ? '3rem' : '4rem',
      headerVariant: dark ? 'dark' : 'light',
      footerVariant: 'solid',
    }),
    recommendedHomeStyle: normalizeHomeStyle(recommendedHomeStyle),
    // Compatibility only. Selection logic must not treat this as ownership.
    homeStyle: normalizeHomeStyle(recommendedHomeStyle),
  });
}

const THEME_REGISTRY = Object.freeze({
  default: theme('default', 'Nordic Blue',
    { primary: '#2563eb', background: '#f8fafc', foreground: '#0f172a', accent: '#3b82f6', card: '#ffffff', cardForeground: '#0f172a', muted: '#64748b' },
    { headerBg: '#ffffff', headerFont: '#0f172a', ctaBg: '#2563eb', ctaColor: '#ffffff', ctaText: 'Latest posts' },
    { footerBg: '#0f172a', footerFont: '#94a3b8', footerDescription: 'Stories and updates from our team.' },
    'dm-sans', 'classic'),
  'theme-1': theme('theme-1', 'Forest Journal',
    { primary: '#166534', background: '#f0fdf4', foreground: '#14532d', accent: '#22c55e', card: '#ffffff', cardForeground: '#14532d', muted: '#4d7c5a' },
    { headerBg: '#14532d', headerFont: '#f0fdf4', ctaBg: '#22c55e', ctaColor: '#052e16', ctaText: 'Explore' },
    { footerBg: '#052e16', footerFont: '#86efac', footerDescription: 'Inspired by nature and growth.' },
    'dm-sans', 'nature'),
  'theme-2': theme('theme-2', 'Terracotta Mosaic',
    { primary: '#ea580c', background: '#fff7ed', foreground: '#7c2d12', accent: '#f97316', card: '#ffffff', cardForeground: '#9a3412', muted: '#c2410c' },
    { headerBg: '#ffffff', headerFont: '#9a3412', ctaBg: '#ea580c', ctaColor: '#ffffff', ctaText: 'Featured' },
    { footerBg: '#7c2d12', footerFont: '#fed7aa', footerDescription: 'Bold stories, bright ideas.' },
    'inter', 'bento'),
  'theme-3': theme('theme-3', 'Ink & Paper',
    { primary: '#dc2626', background: '#fafafa', foreground: '#171717', accent: '#ef4444', card: '#ffffff', cardForeground: '#171717', muted: '#737373' },
    { headerBg: '#ffffff', headerFont: '#171717', ctaBg: '#dc2626', ctaColor: '#ffffff', ctaText: 'Read more' },
    { footerBg: '#171717', footerFont: '#a3a3a3', footerDescription: 'Elegant editorial for modern readers.' },
    'georgia', 'paper'),
  'theme-4': theme('theme-4', 'Lavender Calm',
    { primary: '#7B6B9A', background: '#F8F6FA', foreground: '#2C2835', accent: '#C4A882', card: '#FFFFFF', cardForeground: '#2C2835', muted: '#8A8496' },
    { headerBg: '#F8F6FA', headerFont: '#2C2835', ctaBg: '#7B6B9A', ctaColor: '#F8F6FA', ctaText: 'Start reading' },
    { footerBg: '#2C2835', footerFont: '#D4CFE0', footerDescription: 'A calm space for wellness, reflection, and stories that help you breathe.' },
    'dm-sans', 'bloom'),
  'theme-5': theme('theme-5', 'Ocean Teal',
    { primary: '#0f766e', background: '#f0fdfa', foreground: '#134e4a', accent: '#14b8a6', card: '#ffffff', cardForeground: '#115e59', muted: '#0f766e' },
    { headerBg: '#134e4a', headerFont: '#ccfbf1', ctaBg: '#14b8a6', ctaColor: '#042f2e', ctaText: 'Stories' },
    { footerBg: '#042f2e', footerFont: '#5eead4', footerDescription: 'Wanderlust and written journeys.' },
    'ibm-plex', 'classic'),
  'theme-6': theme('theme-6', 'Midnight Energy',
    { primary: '#22c55e', background: '#0a0a0a', foreground: '#fafafa', accent: '#4ade80', card: '#171717', cardForeground: '#fafafa', muted: '#a3a3a3' },
    { headerBg: '#000000', headerFont: '#fafafa', ctaBg: '#22c55e', ctaColor: '#052e16', ctaText: 'Train hard' },
    { footerBg: '#000000', footerFont: '#737373', footerDescription: 'Strength, discipline, results.' },
    'inter', 'studio'),
  'theme-7': theme('theme-7', 'Portfolio Blue',
    { primary: '#1d4ed8', background: '#eff6ff', foreground: '#1e3a8a', accent: '#3b82f6', card: '#ffffff', cardForeground: '#1e3a8a', muted: '#3b82f6' },
    { headerBg: '#ffffff', headerFont: '#1e3a8a', ctaBg: '#1d4ed8', ctaColor: '#ffffff', ctaText: 'About me' },
    { footerBg: '#1e3a8a', footerFont: '#bfdbfe', footerDescription: 'Professional portfolio and insights.' },
    'ibm-plex', 'studio'),
  'theme-8': theme('theme-8', 'Executive Navy',
    { primary: '#b91c1c', background: '#f8fafc', foreground: '#0f172a', accent: '#dc2626', card: '#ffffff', cardForeground: '#0f172a', muted: '#64748b' },
    { headerBg: '#0f172a', headerFont: '#f8fafc', ctaBg: '#b91c1c', ctaColor: '#ffffff', ctaText: 'Contact' },
    { footerBg: '#020617', footerFont: '#94a3b8', footerDescription: 'Consulting insights that scale.' },
    'inter', 'classic'),
  'theme-9': theme('theme-9', 'Editorial Teal',
    { primary: '#0d9488', background: '#ffffff', foreground: '#134e4a', accent: '#2dd4bf', card: '#f0fdfa', cardForeground: '#115e59', muted: '#5eead4' },
    { headerBg: '#ffffff', headerFont: '#134e4a', ctaBg: '#0d9488', ctaColor: '#ffffff', ctaText: 'Categories' },
    { footerBg: '#134e4a', footerFont: '#99f6e4', footerDescription: 'Clean editorial for curious minds.' },
    'georgia', 'paper'),
  'theme-10': theme('theme-10', 'Newsroom Blue',
    { primary: '#0369a1', background: '#f0f9ff', foreground: '#0c4a6e', accent: '#0ea5e9', card: '#ffffff', cardForeground: '#075985', muted: '#0284c7' },
    { headerBg: '#0c4a6e', headerFont: '#e0f2fe', ctaBg: '#0ea5e9', ctaColor: '#082f49', ctaText: 'Magazine' },
    { footerBg: '#082f49', footerFont: '#7dd3fc', footerDescription: 'News, culture, and long reads.' },
    'dm-sans', 'paper'),
  'theme-11': theme('theme-11', 'Midnight Red',
    { primary: '#ef4444', background: '#09090b', foreground: '#fafafa', accent: '#f87171', card: '#18181b', cardForeground: '#fafafa', muted: '#a1a1aa' },
    { headerBg: '#09090b', headerFont: '#fafafa', ctaBg: '#ef4444', ctaColor: '#ffffff', ctaText: 'Get started' },
    { footerBg: '#000000', footerFont: '#71717a', footerDescription: 'Modern dark experience.' },
    'inter', 'glass'),
});

const THEME_PREVIEW_ASSETS = Object.freeze({
  default: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=80',
  'theme-1': 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=900&q=80',
  'theme-2': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80',
  'theme-3': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80',
  'theme-4': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80',
  'theme-5': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80',
  'theme-6': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
  'theme-7': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80',
  'theme-8': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
  'theme-9': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=80',
  'theme-10': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
  'theme-11': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80',
});

const HOME_LAYOUT_REGISTRY = Object.freeze({
  classic: Object.freeze({ id: 'classic', name: 'Corporate Editorial', description: 'A polished brand hero, featured insight, supporting stories, value pillars, and conversion CTA.', suitableFor: ['Company blogs', 'Consultancies', 'Professional services'], renderer: 'classic', previewAsset: 'layout-preview:classic', defaultContentKey: 'classic', recommendedThemeIds: ['default', 'theme-5', 'theme-8'] }),
  nature: Object.freeze({ id: 'nature', name: 'Immersive Editorial', description: 'An oversized visual cover with curated categories, lead stories, and field-note storytelling.', suitableFor: ['Travel', 'Nature', 'Photography'], renderer: 'nature', previewAsset: 'layout-preview:nature', defaultContentKey: 'nature', recommendedThemeIds: ['theme-1'] }),
  bloom: Object.freeze({ id: 'bloom', name: 'Wellness & Services', description: 'A calm conversion hero, service pillars, expert content, and a reassuring closing CTA.', suitableFor: ['Health', 'Beauty', 'Wellness'], renderer: 'bloom', previewAsset: 'layout-preview:bloom', defaultContentKey: 'bloom', recommendedThemeIds: ['theme-4'] }),
  portals: Object.freeze({ id: 'portals', name: 'Technology Showcase', description: 'A high-contrast innovation homepage with capability cards, featured insight, and strong CTAs.', suitableFor: ['SaaS', 'Technology', 'Startups'], renderer: 'portals', previewAsset: 'layout-preview:portals', defaultContentKey: 'portals', recommendedThemeIds: ['theme-11'] }),
  bento: Object.freeze({ id: 'bento', name: 'Modern Content Grid', description: 'An asymmetric editorial grid that gives featured and supporting content clear visual hierarchy.', suitableFor: ['Creative brands', 'Modern publications'], renderer: 'bento', previewAsset: 'layout-preview:bento', defaultContentKey: 'bento', recommendedThemeIds: ['theme-2'] }),
  studio: Object.freeze({ id: 'studio', name: 'Portfolio Showcase', description: 'A cinematic introduction and responsive project gallery for visually led storytelling.', suitableFor: ['Designers', 'Photographers', 'Personal brands'], renderer: 'studio', previewAsset: 'layout-preview:studio', defaultContentKey: 'studio', recommendedThemeIds: ['theme-6', 'theme-7'] }),
  paper: Object.freeze({ id: 'paper', name: 'Professional Newsroom', description: 'A credible masthead, prominent lead story, and structured editorial columns for frequent publishing.', suitableFor: ['News', 'Reviews', 'High-volume publishing'], renderer: 'paper', previewAsset: 'layout-preview:paper', defaultContentKey: 'paper', recommendedThemeIds: ['theme-3', 'theme-9', 'theme-10'] }),
  glass: Object.freeze({ id: 'glass', name: 'Executive Newsletter', description: 'A focused authority hero, translucent insight cards, and an archive-first newsletter experience.', suitableFor: ['Writers', 'Newsletters', 'Personal brands'], renderer: 'glass', previewAsset: 'layout-preview:glass', defaultContentKey: 'glass', recommendedThemeIds: ['default', 'theme-11'] }),
});

function getThemeRegistration(themeId) {
  return THEME_REGISTRY[String(themeId || 'default')] || THEME_REGISTRY.default;
}

function getHomeLayoutRegistration(homeStyle) {
  return HOME_LAYOUT_REGISTRY[normalizeHomeStyle(homeStyle)] || HOME_LAYOUT_REGISTRY.classic;
}

function validateAppearanceRegistry() {
  const errors = [];
  for (const id of HOME_LAYOUT_IDS) {
    const item = HOME_LAYOUT_REGISTRY[id];
    if (!item) errors.push(`Missing homepage layout registration: ${id}`);
    else for (const field of ['name', 'description', 'renderer', 'previewAsset', 'defaultContentKey']) {
      if (!item[field]) errors.push(`Homepage layout ${id} is missing ${field}`);
    }
  }
  for (const [id, item] of Object.entries(THEME_REGISTRY)) {
    if (item.id !== id) errors.push(`Theme key mismatch: ${id}`);
    for (const field of ['primary', 'background', 'foreground', 'accent', 'card', 'cardForeground', 'muted']) {
      if (!item.colours[field]) errors.push(`Theme ${id} is missing colours.${field}`);
    }
    if (!item.header.headerBg || !item.header.headerFont || !item.footer.footerBg || !item.footer.footerFont || !item.font) {
      errors.push(`Theme ${id} has incomplete chrome or typography tokens`);
    }
    for (const field of ['radius', 'shadow', 'buttonStyle', 'containerWidth', 'sectionSpacing', 'headerVariant', 'footerVariant']) {
      if (!item.tokens[field]) errors.push(`Theme ${id} is missing tokens.${field}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  HOME_LAYOUT_REGISTRY,
  THEME_PREVIEW_ASSETS,
  THEME_REGISTRY,
  getHomeLayoutRegistration,
  getThemeRegistration,
  validateAppearanceRegistry,
};
