const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  console.log(`Total users in database: ${userCount}`);
  const users = await prisma.user.findMany({ select: { email: true, isEmailVerified: true } });
  console.log('Users:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
