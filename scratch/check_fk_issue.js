const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.findUnique({ where: { id: 1 } });
  console.log('User 1:', user1);
  
  const allUsers = await prisma.user.findMany();
  console.log('All Users IDs:', allUsers.map(u => u.id));
  
  const templates = await prisma.template.findMany({ take: 5 });
  console.log('Sample Templates (authorId):', templates.map(t => ({ id: t.id, authorId: t.authorId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
