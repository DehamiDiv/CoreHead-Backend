const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for invalid author references in posts...');
  
  // Find all posts
  const posts = await prisma.posts.findMany({
    select: { id: true, author_id: true }
  });
  
  // Find all valid authors
  const authors = await prisma.authors.findMany({
    select: { id: true }
  });
  const validAuthorIds = new Set(authors.map(a => a.id));
  
  const invalidPosts = posts.filter(p => p.author_id !== null && !validAuthorIds.has(p.author_id));
  
  console.log(`Found ${invalidPosts.length} posts with invalid author IDs.`);
  
  if (invalidPosts.length > 0) {
    console.log('Resetting invalid author_id to NULL...');
    const result = await prisma.posts.updateMany({
      where: {
        id: { in: invalidPosts.map(p => p.id) }
      },
      data: {
        author_id: null
      }
    });
    console.log(`Updated ${result.count} posts.`);
  } else {
    console.log('No invalid references found.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
