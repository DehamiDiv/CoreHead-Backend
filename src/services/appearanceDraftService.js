const { getThemeRegistration } = require('../contracts/appearance-registry-v1');
const { normalizeHomeStyle } = require('../contracts/appearance-model-v1');

const DRAFT_KEY = 'appearance_draft';
const LIVE_KEYS = new Set([
  'active_theme', 'site_colours', 'site_header', 'site_footer', 'site_font', 'home_layout',
]);

function parseValue(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function prepareAppearanceDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Appearance draft must be an object.'), { statusCode: 400 });
  }
  const themeId = getThemeRegistration(input.themeId).id;
  const homeStyle = normalizeHomeStyle(input.homeStyle);
  const settings = input.settings && typeof input.settings === 'object' ? input.settings : {};
  const sanitized = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!LIVE_KEYS.has(key)) {
      throw Object.assign(new Error(`Appearance setting is not allowed: ${key}`), { statusCode: 400 });
    }
    sanitized[key] = parseValue(value);
  }
  sanitized.active_theme = { themeId };
  sanitized.home_layout = {
    ...(sanitized.home_layout && typeof sanitized.home_layout === 'object' ? sanitized.home_layout : {}),
    homeStyle,
  };
  return { version: 1, themeId, homeStyle, settings: sanitized };
}

async function upsertSetting(tx, siteId, key, value) {
  return tx.setting.upsert({
    where: { siteId_key: { siteId: Number(siteId), key } },
    update: { value: JSON.stringify(value) },
    create: { siteId: Number(siteId), key, value: JSON.stringify(value) },
  });
}

async function saveAppearanceDraft(prisma, siteId, input) {
  const draft = prepareAppearanceDraft(input);
  await upsertSetting(prisma, siteId, DRAFT_KEY, { ...draft, status: 'draft' });
  return draft;
}

async function applyAppearanceDraft(prisma, siteId, input) {
  const draft = prepareAppearanceDraft(input);
  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(draft.settings)) {
      await upsertSetting(tx, siteId, key, value);
    }
    await upsertSetting(tx, siteId, DRAFT_KEY, {
      ...draft,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    });
  });
  return draft;
}

module.exports = { DRAFT_KEY, LIVE_KEYS, applyAppearanceDraft, prepareAppearanceDraft, saveAppearanceDraft };
