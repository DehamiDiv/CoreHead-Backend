/**
 * Replace Verdura post covers with elegant high-quality nature photography.
 *   node scripts/updateVerduraPostCovers.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS = path.join(__dirname, '../public/uploads');

/** Elegant editorial covers (Unsplash) */
const COVERS = [
  {
    slug: 'beginners-guide-vegetable-garden',
    file: 'verdura-cover-vegetable-garden.jpg',
    name: 'Elegant Vegetable Garden',
    // Soft green garden rows, golden light
    url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=88',
  },
  {
    slug: 'solar-energy-home-guide',
    file: 'verdura-cover-solar-energy.jpg',
    name: 'Elegant Solar Home',
    // Clean modern solar architecture
    url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1400&q=88',
  },
  {
    slug: 'organic-gardening-101',
    file: 'verdura-cover-organic-gardening.jpg',
    name: 'Elegant Organic Produce',
    // Fresh elegant produce still life
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=88',
  },
  {
    slug: 'protecting-endangered-species',
    file: 'verdura-cover-endangered-species.jpg',
    name: 'Elegant Wildlife Portrait',
    // Majestic deer in soft forest light
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1400&q=88',
  },
  {
    slug: 'wildlife-photography-guide',
    file: 'verdura-cover-wildlife-photography.jpg',
    name: 'Elegant Wildlife Photography',
    // Camera + nature aesthetic bird
    url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1400&q=88',
  },
  {
    slug: 'climate-change-impact-ecosystems',
    file: 'verdura-cover-climate-ecosystems.jpg',
    name: 'Elegant Glacier Landscape',
    // Dramatic ice / climate landscape
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=88',
  },
  {
    slug: 'breathtaking-hiking-trails',
    file: 'verdura-cover-hiking-trails.jpg',
    name: 'Elegant Mountain Trail',
    // Misty mountain trail
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=88',
  },
  {
    slug: 'aquatic-plants-home-aquariums',
    file: 'verdura-cover-aquatic-plants.jpg',
    name: 'Elegant Water Lily',
    // Serene water lily (no clownfish)
    url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1400&q=88',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'Verdura-Cover-Update/1.0',
            Accept: 'image/*',
          },
        },
        (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            file.close();
            try {
              fs.unlinkSync(dest);
            } catch (_) {}
            return download(res.headers.location, dest)
              .then(resolve)
              .catch(reject);
          }
          if (res.statusCode !== 200) {
            file.close();
            try {
              fs.unlinkSync(dest);
            } catch (_) {}
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve(dest)));
        }
      )
      .on('error', (err) => {
        file.close();
        try {
          fs.unlinkSync(dest);
        } catch (_) {}
        reject(err);
      });
  });
}

async function ensureMedia(siteId, name, url, size) {
  const existing = await prisma.media.findFirst({
    where: { siteId, url, isDeleted: false },
  });
  if (existing) {
    return prisma.media.update({
      where: { id: existing.id },
      data: { name, type: 'image/jpeg', size: String(size) },
    });
  }
  return prisma.media.create({
    data: {
      name,
      type: 'image/jpeg',
      size: String(size),
      url,
      isDeleted: false,
      siteId,
    },
  });
}

async function main() {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

  const site = await prisma.site.findUnique({ where: { slug: 'verdura' } });
  if (!site) throw new Error('Verdura site not found');

  console.log('\n🌿 Updating Verdura post covers (elegant set)...\n');

  for (const item of COVERS) {
    const dest = path.join(UPLOADS, item.file);
    const coverPath = `/uploads/${item.file}`;
    try {
      console.log(`⬇️  ${item.slug}`);
      await download(item.url, dest);
      const size = fs.statSync(dest).size;
      if (size < 5000) throw new Error('file too small');

      await ensureMedia(site.id, item.name, coverPath, size);

      const post = await prisma.post.findFirst({
        where: { siteId: site.id, slug: item.slug },
      });
      if (post) {
        await prisma.post.update({
          where: { id: post.id },
          data: { coverImage: coverPath },
        });
        console.log(`   ✅ ${post.title.slice(0, 50)}…`);
      } else {
        console.log(`   ⚠️  post not found: ${item.slug}`);
      }
    } catch (err) {
      console.error(`   ❌ ${item.slug}: ${err.message}`);
    }
  }

  console.log('\n🎉 Done. Hard-refresh /s/verdura/blog\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
