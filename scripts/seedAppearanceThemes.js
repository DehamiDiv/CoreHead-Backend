/**
 * Seed Appearance themes for every site (R2-4).
 * - Sets active_theme (default: theme-7 Portfolio Blue for tech demos)
 * - Seeds colours/header/footer/font for ALL built-in themes so switching works
 *
 * Usage: node scripts/seedAppearanceThemes.js
 * Optional: ACTIVE_THEME=theme-6 node scripts/seedAppearanceThemes.js
 */
const { PrismaClient } = require('@prisma/client');
const {
  PRESETS,
  getPreset,
  DEFAULT_THEME_NAV_LINKS,
  DEFAULT_THEME_FOOTER_LINKS,
} = require('../src/utils/themePresets');

const prisma = new PrismaClient();

const ACTIVE =
  process.env.ACTIVE_THEME ||
  process.argv[2] ||
  'theme-7';

const stringify = (v) => JSON.stringify(v);

async function upsertSetting(siteId, key, valueObj) {
  const value = stringify(valueObj);
  const existing = await prisma.setting.findFirst({
    where: { siteId, key },
  });
  if (existing) {
    return prisma.setting.update({
      where: { id: existing.id },
      data: { value },
    });
  }
  return prisma.setting.create({
    data: { siteId, key, value },
  });
}

function headerPayload(preset, site) {
  return {
    headerBg: preset.header.headerBg,
    headerFont: preset.header.headerFont,
    ctaBg: preset.header.ctaBg,
    ctaColor: preset.header.ctaColor,
    ctaText: preset.header.ctaText || 'Latest posts',
    ctaUrl: '/blog',
    navLinks: DEFAULT_THEME_NAV_LINKS,
    headerLogo: site.logo || null,
  };
}

function footerPayload(preset, site) {
  return {
    footerBg: preset.footer.footerBg,
    footerFont: preset.footer.footerFont,
    footerDescription:
      preset.footer.footerDescription ||
      `Stories and updates from ${site.name}.`,
    copyrightText: `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`,
    quickLinks: DEFAULT_THEME_FOOTER_LINKS,
    footerLogo: site.logo || null,
  };
}

async function seedSite(site) {
  const activeId = PRESETS[ACTIVE] ? ACTIVE : 'default';
  const activePreset = getPreset(activeId);

  await upsertSetting(site.id, 'active_theme', { themeId: activeId });

  const themeIds = Object.keys(PRESETS);
  for (const themeId of themeIds) {
    const preset = getPreset(themeId);
    await upsertSetting(site.id, `theme_${themeId}_colours`, {
      ...preset.colours,
    });
    await upsertSetting(
      site.id,
      `theme_${themeId}_header`,
      headerPayload(preset, site)
    );
    await upsertSetting(
      site.id,
      `theme_${themeId}_footer`,
      footerPayload(preset, site)
    );
    await upsertSetting(site.id, `theme_${themeId}_font`, {
      font: preset.font || 'dm-sans',
    });
  }

  return {
    siteId: site.id,
    name: site.name,
    slug: site.slug,
    activeTheme: activeId,
    activePrimary: activePreset.colours.primary,
    themesSeeded: themeIds.length,
  };
}

async function main() {
  const sites = await prisma.site.findMany({
    orderBy: { id: 'asc' },
  });

  if (!sites.length) {
    console.log('No sites found. Create a site first, then re-run.');
    return;
  }

  console.log(`Seeding appearance for ${sites.length} site(s)...`);
  console.log(`Active theme: ${ACTIVE}`);

  const results = [];
  for (const site of sites) {
    const r = await seedSite(site);
    results.push(r);
    console.log(
      `  ✓ ${r.name} (/s/${r.slug}) → active=${r.activeTheme} primary=${r.activePrimary} (${r.themesSeeded} themes)`
    );
  }

  console.log('\nDone. Open public site and hard-refresh (Ctrl+Shift+R).');
  console.log('Change theme later: Admin → Settings → Appearance → Activate.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
