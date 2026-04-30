const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List all users in the database
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true }
  });

  if (users.length === 0) {
    console.log('No users found in the database.');
  } else {
    console.log(`Found ${users.length} user(s):`);
    users.forEach(u => {
      console.log(`  ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
