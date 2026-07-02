const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  console.log(`Total users in database: ${userCount}`);
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true
    }
  });
  console.log('Users in DB:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
