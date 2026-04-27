const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock posts...');

  // Create an author first
  const author = await prisma.authors.create({
    data: {
      name: 'Yaluwa',
      email: 'yaluwa@example.com',
      bio: 'A cool friend sharing ideas.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    }
  });

  // Create some mock published posts
  await prisma.post.createMany({
    data: [
      {
        title: 'Exploring the new Frontend',
        slug: 'exploring-frontend',
        excerpt: 'This is a test post from a friend.',
        body: '<p>Content of the first friend post.</p>',
        featured_image: 'https://picsum.photos/seed/1/800/600',
        category: 'Technology',
        tags: ['frontend', 'friend'],
        author_id: author.id,
        status: 'published',
        published_date: new Date()
      },
      {
        title: 'How to build great APIs',
        slug: 'how-to-build-apis',
        excerpt: 'Learning backend connections.',
        body: '<p>Some awesome backend content here.</p>',
        featured_image: 'https://picsum.photos/seed/2/800/600',
        category: 'Backend',
        tags: ['api', 'nodejs'],
        author_id: author.id,
        status: 'published',
        published_date: new Date()
      },
      {
        title: 'Life in Sri Lanka',
        slug: 'life-in-sri-lanka',
        excerpt: 'A beautiful journey.',
        body: '<p>Sri Lanka is wonderful.</p>',
        featured_image: 'https://picsum.photos/seed/3/800/600',
        category: 'Lifestyle',
        tags: ['travel'],
        author_id: author.id,
        status: 'published',
        published_date: new Date()
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
