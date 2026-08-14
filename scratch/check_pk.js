const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const constraints = await prisma.$queryRawUnsafe(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'public.comments'::regclass;
    `);
    console.log("Constraints of comments table:", JSON.stringify(constraints, null, 2));
  } catch (error) {
    console.error("Error checking constraints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
