const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Guides site...');

  // 1. Find the admin user
  const adminEmail = 'admin@corehead.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    console.log('Admin user not found. Creating one...');
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Admin@CoreHead2026', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        role: 'admin',
        isEmailVerified: true
      },
    });
  }

  // 2. Check if Guides site exists
  let site = await prisma.site.findUnique({ where: { slug: 'guides' } });
  
  if (!site) {
    console.log('Creating Guides site...');
    site = await prisma.site.create({
      data: {
        name: 'Guides',
        slug: 'guides',
        ownerId: admin.id,
        status: 'active',
        plan: 'premium',
        planStatus: 'active',
      },
    });
  } else {
    console.log('Guides site already exists. Making sure admin is owner...');
    site = await prisma.site.update({
      where: { slug: 'guides' },
      data: { ownerId: admin.id }
    });
  }

  console.log('Guides site is ready! Slug: guides');

  // 3. Optional: Create a sample guide post if none exists
  const existingPost = await prisma.post.findFirst({ where: { siteId: site.id } });
  if (!existingPost) {
    console.log('Creating a sample guide post...');
    await prisma.post.create({
      data: {
        title: 'Welcome to CoreHead Guides',
        slug: 'welcome-to-corehead-guides',
        excerpt: 'This is a sample guide to show you how guides work.',
        content: '<h2>Welcome!</h2><p>You can create more guides from the admin dashboard.</p>',
        published: true,
        authorId: admin.id,
        siteId: site.id,
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.();
  });
