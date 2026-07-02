const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  
  // 1. Delete Template History
  await prisma.templateHistory.deleteMany();
  console.log('Deleted template histories.');

  // 2. Delete Templates
  await prisma.template.deleteMany();
  console.log('Deleted templates.');

  // 3. Delete Posts
  await prisma.post.deleteMany();
  console.log('Deleted posts.');

  // 4. Delete Users
  const deleteCount = await prisma.user.deleteMany();
  console.log(`Deleted ${deleteCount.count} users.`);
  
  console.log('Database cleaned successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
