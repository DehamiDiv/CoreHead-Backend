const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock posts...');

  // Get or create the admin user to associate posts with
  let user = await prisma.user.findUnique({
    where: { email: 'admin@corehead.com' }
  });

  if (!user) {
    // If not found, create a temporary user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin@CoreHead2026', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@corehead.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        name: 'Administrator'
      }
    });
  }

  // Create some mock published posts
  // Note: We use the Prisma model field names: content, coverImage, authorId, publishedAt
  await prisma.post.createMany({
    data: [
      {
        title: 'Exploring the new Frontend',
        slug: 'exploring-frontend',
        excerpt: 'This is a test post from a friend.',
        content: '<p>Content of the first friend post.</p>',
        coverImage: 'https://picsum.photos/seed/1/800/600',
        category: 'Technology',
        tags: ['frontend', 'friend'],
        authorId: user.id,
        status: 'published',
        publishedAt: new Date()
      },
      {
        title: 'How to build great APIs',
        slug: 'how-to-build-apis',
        excerpt: 'Learning backend connections.',
        content: '<p>Some awesome backend content here.</p>',
        coverImage: 'https://picsum.photos/seed/2/800/600',
        category: 'Backend',
        tags: ['api', 'nodejs'],
        authorId: user.id,
        status: 'published',
        publishedAt: new Date()
      },
      {
        title: 'Life in Sri Lanka',
        slug: 'life-in-sri-lanka',
        excerpt: 'A beautiful journey.',
        content: '<p>Sri Lanka is wonderful.</p>',
        coverImage: 'https://picsum.photos/seed/3/800/600',
        category: 'Lifestyle',
        tags: ['travel'],
        authorId: user.id,
        status: 'published',
        publishedAt: new Date()
      }
    ]
  });

  console.log('Mock posts seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
