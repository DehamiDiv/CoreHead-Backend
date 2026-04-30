const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT id, email FROM users`;
  console.log('Users in DB:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
