/**
 * seedVerduraMediaLibrary.js
 *
 * Downloads Verdura post cover images + brand assets into public/uploads
 * and registers them in the media library for the Verdura site.
 * Also updates post coverImage URLs to local /uploads paths.
 *
 * Usage (from CoreHead-Backend):
 *   node scripts/seedVerduraMediaLibrary.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const SITE_SLUG = 'verdura';

/** Images used on the Verdura site (posts + branding). */
const MEDIA_ASSETS = [
  {
    key: 'vegetable-garden',
    name: 'Vegetable Garden Cover.jpg',
    fileName: 'verdura-cover-vegetable-garden.jpg',
    source:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['beginners-guide-vegetable-garden'],
  },
  {
    key: 'solar-energy',
    name: 'Solar Energy Cover.jpg',
    fileName: 'verdura-cover-solar-energy.jpg',
    source:
      'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['solar-energy-home-guide'],
  },
  {
    key: 'organic-gardening',
    name: 'Organic Gardening Cover.jpg',
    fileName: 'verdura-cover-organic-gardening.jpg',
    source:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['organic-gardening-101'],
  },
  {
    key: 'endangered-species',
    name: 'Wildlife Conservation Cover.jpg',
    fileName: 'verdura-cover-endangered-species.jpg',
    source:
      'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['protecting-endangered-species'],
  },
  {
    key: 'wildlife-photo',
    name: 'Wildlife Photography Cover.jpg',
    fileName: 'verdura-cover-wildlife-photography.jpg',
    source:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['wildlife-photography-guide'],
  },
  {
    key: 'climate-change',
    name: 'Climate Ecosystems Cover.jpg',
    fileName: 'verdura-cover-climate-ecosystems.jpg',
    source:
      'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['climate-change-impact-ecosystems'],
  },
  {
    key: 'hiking-trails',
    name: 'Hiking Trails Cover.jpg',
    fileName: 'verdura-cover-hiking-trails.jpg',
    source:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['breathtaking-hiking-trails'],
  },
  {
    key: 'aquatic-plants',
    name: 'Aquatic Plants Cover.jpg',
    fileName: 'verdura-cover-aquatic-plants.jpg',
    source:
      'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=1200&q=80',
    type: 'image/jpeg',
    postSlugs: ['aquatic-plants-home-aquariums'],
  },
  {
    key: 'hero-forest',
    name: 'Verdura Hero Forest.jpg',
    fileName: 'verdura-hero-forest.jpg',
    source:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80',
    type: 'image/jpeg',
    postSlugs: [],
  },
  {
    key: 'hero-home',
    name: 'Verdura Home Hero Landscape.jpg',
    fileName: 'verdura-hero-home.jpg',
    source:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85',
    type: 'image/jpeg',
    postSlugs: [],
  },
  {
    key: 'hero-editorial',
    name: 'Verdura Editorial Hero.jpg',
    fileName: 'verdura-hero-editorial.jpg',
    source:
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1800&q=90',
    type: 'image/jpeg',
    postSlugs: [],
  },
];

/** Local brand files already in public/uploads or frontend demo. */
const LOCAL_BRAND_ASSETS = [
  {
    name: 'Verdura Icon.svg',
    fileName: 'verdura-icon.svg',
    type: 'image/svg+xml',
    fallbacks: [
      path.join(__dirname, '../public/uploads/verdura-icon.svg'),
      path.join(
        __dirname,
        '../../corehead-frontend/frontend/public/demo/verdura-icon.svg'
      ),
    ],
  },
  {
    name: 'Verdura Icon.jpg',
    fileName: 'verdura-icon.jpg',
    type: 'image/jpeg',
    fallbacks: [
      path.join(__dirname, '../public/uploads/verdura-icon.jpg'),
      path.join(
        __dirname,
        '../../corehead-frontend/frontend/public/demo/verdura-icon.jpg'
      ),
    ],
  },
  {
    name: 'Verdura Logo.svg',
    fileName: 'verdura-logo.svg',
    type: 'image/svg+xml',
    fallbacks: [
      path.join(__dirname, '../public/uploads/verdura-logo.svg'),
      path.join(
        __dirname,
        '../../corehead-frontend/frontend/public/demo/verdura-logo.svg'
      ),
    ],
  },
  {
    name: 'Verdura Logo Light.svg',
    fileName: 'verdura-logo-light.svg',
    type: 'image/svg+xml',
    fallbacks: [
      path.join(__dirname, '../public/uploads/verdura-logo-light.svg'),
      path.join(
        __dirname,
        '../../corehead-frontend/frontend/public/demo/verdura-logo-light.svg'
      ),
    ],
  },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'CoreHead-Verdura-Media-Seeder/1.0',
          Accept: 'image/*',
        },
      },
      (res) => {
        // Follow redirects (Unsplash often redirects)
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          file.close();
          fs.unlink(destPath, () => {});
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(
            new Error(`HTTP ${res.statusCode} for ${url}`)
          );
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve(destPath));
        });
      }
    );

    req.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function ensureMediaRecord({ siteId, name, type, size, url }) {
  const existing = await prisma.media.findFirst({
    where: {
      siteId,
      url,
      isDeleted: false,
    },
  });
  if (existing) {
    // Keep name/type/size fresh
    return prisma.media.update({
      where: { id: existing.id },
      data: { name, type, size: String(size) },
    });
  }
  return prisma.media.create({
    data: {
      name,
      type,
      size: String(size),
      url,
      isDeleted: false,
      siteId,
    },
  });
}

async function main() {
  console.log('\n🖼️  Seeding Verdura media library...\n');

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });
  if (!site) {
    console.error(
      `❌ Site "${SITE_SLUG}" not found. Run seedVerduraDemoSite.js first.`
    );
    process.exit(1);
  }
  console.log(`✅ Site: ${site.name} (id=${site.id})\n`);

  let created = 0;
  let updated = 0;
  let downloaded = 0;
  const urlByPostSlug = {};

  // ── Remote covers ──────────────────────────────────────────────
  for (const asset of MEDIA_ASSETS) {
    const dest = path.join(UPLOADS_DIR, asset.fileName);
    const url = `/uploads/${asset.fileName}`;

    try {
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
        console.log(`⬇️  Downloading ${asset.name}...`);
        await downloadFile(asset.source, dest);
        downloaded++;
      } else {
        console.log(`⏭️  Already on disk: ${asset.fileName}`);
      }

      const size = fs.statSync(dest).size;
      const before = await prisma.media.findFirst({
        where: { siteId: site.id, url, isDeleted: false },
      });
      await ensureMediaRecord({
        siteId: site.id,
        name: asset.name,
        type: asset.type,
        size,
        url,
      });
      if (before) updated++;
      else created++;

      for (const slug of asset.postSlugs || []) {
        urlByPostSlug[slug] = url;
      }
      console.log(`   📚 Media library: ${asset.name} → ${url}`);
    } catch (err) {
      console.error(`   ❌ Failed ${asset.name}: ${err.message}`);
    }
  }

  // ── Local brand assets ─────────────────────────────────────────
  for (const asset of LOCAL_BRAND_ASSETS) {
    const dest = path.join(UPLOADS_DIR, asset.fileName);
    let sourcePath = asset.fallbacks.find((p) => fs.existsSync(p));

    if (!sourcePath) {
      console.warn(`⚠️  Missing brand file: ${asset.fileName}`);
      continue;
    }

    if (path.resolve(sourcePath) !== path.resolve(dest)) {
      fs.copyFileSync(sourcePath, dest);
    }

    const size = fs.statSync(dest).size;
    const url = `/uploads/${asset.fileName}`;
    const before = await prisma.media.findFirst({
      where: { siteId: site.id, url, isDeleted: false },
    });
    await ensureMediaRecord({
      siteId: site.id,
      name: asset.name,
      type: asset.type,
      size,
      url,
    });
    if (before) updated++;
    else created++;
    console.log(`📎 Brand media: ${asset.name} → ${url}`);
  }

  // ── Point posts at local media URLs ────────────────────────────
  let postsUpdated = 0;
  for (const [slug, coverUrl] of Object.entries(urlByPostSlug)) {
    const post = await prisma.post.findFirst({
      where: { siteId: site.id, slug },
    });
    if (!post) continue;
    if (post.coverImage === coverUrl) continue;
    await prisma.post.update({
      where: { id: post.id },
      data: { coverImage: coverUrl },
    });
    postsUpdated++;
    console.log(`🔗 Post cover updated: ${slug}`);
  }

  const total = await prisma.media.count({
    where: { siteId: site.id, isDeleted: false },
  });

  console.log(`
🎉 Verdura media library ready!

  Downloaded files : ${downloaded}
  Media created    : ${created}
  Media updated    : ${updated}
  Posts re-linked  : ${postsUpdated}
  Total in library : ${total}

  Open Admin → Media (with Verdura selected)
`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
