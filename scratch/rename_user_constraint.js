const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Renaming User_pkey constraint to users_pkey on 'users' table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
    `);
    console.log("Constraint renamed successfully!");
  } catch (error) {
    console.error("Error renaming constraint:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
