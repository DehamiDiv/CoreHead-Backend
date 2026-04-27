const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const authorCount = await prisma.authors.count();
  const userCount = await prisma.users.count();
  const postCount = await prisma.post.count();
  
  console.log(`Authors: ${authorCount}`);
  console.log(`Users: ${userCount}`);
  console.log(`Posts: ${postCount}`);
  
  const samplePosts = await prisma.post.findMany({ take: 5 });
  console.log('Sample Posts (author_id):', samplePosts.map(p => ({ id: p.id, title: p.title, author_id: p.author_id })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
