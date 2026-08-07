const prisma = require('../src/models/prismaClient');

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USER LIST ---');
  for (const u of users) {
    console.log(`Email: ${u.email} | Role: ${u.role}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
