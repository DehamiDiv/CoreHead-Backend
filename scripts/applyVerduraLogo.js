const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
// Prefer Next.js public/demo so logo always loads without API rewrite
const logo = '/demo/verdura-logo.png';

async function main() {
  const file = path.join(__dirname, '../public/uploads/verdura-logo.png');
  if (!fs.existsSync(file)) {
    throw new Error('Logo file missing: ' + file);
  }
  const size = fs.statSync(file).size;

  const site = await prisma.site.findUnique({ where: { slug: 'verdura' } });
  if (!site) throw new Error('Verdura site not found');

  await prisma.site.update({
    where: { id: site.id },
    data: { logo },
  });

  const headerRow = await prisma.setting.findFirst({
    where: { siteId: site.id, key: 'theme_theme-1_header' },
  });
  if (headerRow) {
    const header = JSON.parse(headerRow.value);
    header.headerLogo = logo;
    await prisma.setting.update({
      where: { id: headerRow.id },
      data: { value: JSON.stringify(header) },
    });
  }

  const footerRow = await prisma.setting.findFirst({
    where: { siteId: site.id, key: 'theme_theme-1_footer' },
  });
  if (footerRow) {
    const footer = JSON.parse(footerRow.value);
    footer.footerLogo = logo;
    await prisma.setting.update({
      where: { id: footerRow.id },
      data: { value: JSON.stringify(footer) },
    });
  }

  const metaRow = await prisma.setting.findFirst({
    where: { siteId: site.id, key: 'website_metadata' },
  });
  if (metaRow) {
    const meta = JSON.parse(metaRow.value);
    meta.favicon = logo;
    await prisma.setting.update({
      where: { id: metaRow.id },
      data: { value: JSON.stringify(meta) },
    });
  }

  const media = await prisma.media.findFirst({
    where: { siteId: site.id, url: logo, isDeleted: false },
  });
  if (media) {
    await prisma.media.update({
      where: { id: media.id },
      data: { name: 'Verdura Logo', type: 'image/png', size: String(size) },
    });
  } else {
    await prisma.media.create({
      data: {
        name: 'Verdura Logo',
        type: 'image/png',
        size: String(size),
        url: logo,
        siteId: site.id,
        isDeleted: false,
      },
    });
  }

  const updated = await prisma.site.findUnique({ where: { id: site.id } });
  const h = await prisma.setting.findFirst({
    where: { siteId: site.id, key: 'theme_theme-1_header' },
  });
  console.log('site.logo =', updated.logo);
  console.log('headerLogo =', JSON.parse(h.value).headerLogo);
  console.log('OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
