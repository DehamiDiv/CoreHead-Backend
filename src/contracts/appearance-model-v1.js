'use strict';

const HOME_LAYOUT_IDS = Object.freeze([
  'classic', 'nature', 'bloom', 'portals', 'bento', 'studio', 'paper', 'glass',
]);

const LEGACY_HOME_LAYOUT_ALIASES = Object.freeze({
  editorial: 'nature',
  agents: 'portals',
  dark: 'studio',
  magazine: 'paper',
  minimal: 'glass',
});

const APPEARANCE_SETTING_OWNERSHIP = Object.freeze({
  theme: Object.freeze([
    'active_theme', 'site_colours', 'site_font', 'site_header', 'site_footer',
    'theme_{themeId}_colours', 'theme_{themeId}_font',
    'theme_{themeId}_header', 'theme_{themeId}_footer',
  ]),
  homepage: Object.freeze(['home_layout']),
});

function parseStoredValue(raw) {
  if (raw == null || raw === '') return raw;
  let value = raw;
  for (let attempt = 0; attempt < 3 && typeof value === 'string'; attempt += 1) {
    const source = value.trim();
    if (!source || !(source.startsWith('{') || source.startsWith('[') || source.startsWith('"'))) break;
    try {
      value = JSON.parse(source);
    } catch {
      break;
    }
  }
  return value;
}

function normalizeHomeStyle(value, fallback = 'classic') {
  const candidate = String(value || '').trim();
  if (HOME_LAYOUT_IDS.includes(candidate)) return candidate;
  if (LEGACY_HOME_LAYOUT_ALIASES[candidate]) return LEGACY_HOME_LAYOUT_ALIASES[candidate];
  return fallback;
}

function extractHomeStyle(raw) {
  const value = parseStoredValue(raw);
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    return normalizeHomeStyle(value.trim(), '') || null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value.homeStyle || value.layout || null;
    return candidate == null ? null : normalizeHomeStyle(candidate, '') || null;
  }
  return null;
}

function preserveHomeLayoutForThemeChange(raw, currentHomeStyle) {
  const existingStyle = extractHomeStyle(raw);
  if (existingStyle) {
    return { changed: false, homeStyle: existingStyle, value: raw };
  }
  const homeStyle = normalizeHomeStyle(currentHomeStyle);
  const parsed = parseStoredValue(raw);
  const base = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  return { changed: true, homeStyle, value: { ...base, homeStyle } };
}

function selectTheme(state, themeId) {
  return { ...(state || {}), themeId: String(themeId || 'default') };
}

function selectHomeLayout(state, homeStyle) {
  return { ...(state || {}), homeStyle: normalizeHomeStyle(homeStyle) };
}

module.exports = {
  APPEARANCE_SETTING_OWNERSHIP,
  HOME_LAYOUT_IDS,
  LEGACY_HOME_LAYOUT_ALIASES,
  extractHomeStyle,
  normalizeHomeStyle,
  preserveHomeLayoutForThemeChange,
  selectHomeLayout,
  selectTheme,
};
