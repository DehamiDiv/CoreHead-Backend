const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" INTEGER REFERENCES categories(id) ON DELETE SET NULL;
  `);
  console.log('Successfully added parentId column to categories table.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
