const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Altering columns of 'Post' table manually...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ALTER COLUMN "title" TYPE text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ALTER COLUMN "slug" TYPE text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ALTER COLUMN "status" TYPE text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ALTER COLUMN "coverImage" TYPE text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ALTER COLUMN "category" TYPE text;
    `);
    console.log("Columns altered successfully!");
  } catch (error) {
    console.error("Error altering Post columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
