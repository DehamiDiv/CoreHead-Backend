const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: { name: true, email: true }
      }
    }
  });

  console.log(`Found ${posts.length} post(s):`);
  posts.forEach(p => {
    console.log(`- ID: ${p.id} | Title: "${p.title}" | Status: ${p.status} | Author: ${p.author?.name || 'unknown'} (${p.author?.email || 'N/A'})`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
