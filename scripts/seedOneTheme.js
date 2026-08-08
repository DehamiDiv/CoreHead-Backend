/**
 * Set up ONE appearance theme for all sites (or one site).
 *
 * Usage:
 *   node scripts/seedOneTheme.js theme-1
 *   node scripts/seedOneTheme.js theme-6 --activate
 *   node scripts/seedOneTheme.js default --activate --site=corehead
 */
const { PrismaClient } = require('@prisma/client');
const {
  PRESETS,
  getPreset,
  DEFAULT_THEME_NAV_LINKS,
  DEFAULT_THEME_FOOTER_LINKS,
} = require('../src/utils/themePresets');

const prisma = new PrismaClient();

const themeId = process.argv[2] || 'default';
const makeActive = process.argv.includes('--activate');
const siteArg = process.argv.find((a) => a.startsWith('--site='));
const siteSlug = siteArg ? siteArg.split('=')[1] : null;

async function upsertSetting(siteId, key, valueObj) {
  const value = JSON.stringify(valueObj);
  const existing = await prisma.setting.findFirst({ where: { siteId, key } });
  if (existing) {
    return prisma.setting.update({ where: { id: existing.id }, data: { value } });
  }
  return prisma.setting.create({ data: { siteId, key, value } });
}

async function main() {
  if (!PRESETS[themeId] && themeId !== 'default') {
    console.error(`Unknown theme: ${themeId}`);
    console.error('Known:', Object.keys(PRESETS).join(', '));
    process.exit(1);
  }

  const preset = getPreset(themeId);
  let sites = await prisma.site.findMany({ orderBy: { id: 'asc' } });
  if (siteSlug) {
    sites = sites.filter((s) => s.slug === siteSlug);
    if (!sites.length) {
      console.error(`No site with slug: ${siteSlug}`);
      process.exit(1);
    }
  }

  console.log(
    `Setting up theme "${themeId}" (${preset.colours?.primary}) for ${sites.length} site(s)${
      makeActive ? ' + ACTIVATE' : ''
    }...`
  );

  for (const site of sites) {
    await upsertSetting(site.id, `theme_${themeId}_colours`, { ...preset.colours });
    await upsertSetting(site.id, `theme_${themeId}_header`, {
      headerBg: preset.header.headerBg,
      headerFont: preset.header.headerFont,
      ctaBg: preset.header.ctaBg,
      ctaColor: preset.header.ctaColor,
      ctaText: preset.header.ctaText,
      ctaUrl: '/blog',
      navLinks: DEFAULT_THEME_NAV_LINKS,
      headerLogo: site.logo || null,
    });
    await upsertSetting(site.id, `theme_${themeId}_footer`, {
      footerBg: preset.footer.footerBg,
      footerFont: preset.footer.footerFont,
      footerDescription:
        preset.footer.footerDescription || `Stories from ${site.name}.`,
      copyrightText: `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`,
      quickLinks: DEFAULT_THEME_FOOTER_LINKS,
      footerLogo: site.logo || null,
    });
    await upsertSetting(site.id, `theme_${themeId}_font`, {
      font: preset.font || 'dm-sans',
    });
    if (makeActive) {
      await upsertSetting(site.id, 'active_theme', { themeId });
    }
    console.log(`  ✓ ${site.name} (/s/${site.slug})`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
