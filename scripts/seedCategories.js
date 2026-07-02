const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categories...');

  // Create default categories
  const count = await prisma.categories.createMany({
    data: [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest trends, tutorials and tools in software development.'
      },
      {
        name: 'Backend',
        slug: 'backend',
        description: 'Server side scripting, APIs, and database configurations.'
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Stories, journeys and adventures of everyday life.'
      }
    ],
    skipDuplicates: true
  });

  console.log(`Seeded categories successfully!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
