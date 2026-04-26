const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in DB:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error listing users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
