const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMapping() {
  try {
    // Now testing with the mapped 'post' model (uppercase in schema but prisma.post in client)
    const count = await prisma.post.count();
    console.log(`Verified count using mapped Post model: ${count}`);
    
    if (count > 0) {
      const posts = await prisma.post.findMany({ take: 1 });
      console.log('Post found through mapping:', JSON.stringify(posts, null, 2));
    }
  } catch (error) {
    console.error('Mapping verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMapping();
