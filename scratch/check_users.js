const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- Current Users in Database ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  });
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
