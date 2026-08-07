const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Current Users:", users.map(u => ({ id: u.id, email: u.email, role: u.role, isEmailVerified: u.isEmailVerified })));
  
  const updatedUser = await prisma.user.updateMany({
    data: { role: 'admin', isEmailVerified: true },
  });
  console.log(`Updated ${updatedUser.count} users to admin role and verified their emails.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
