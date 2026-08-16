const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Applying columns to 'users' table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationOTP" TEXT;
    `);
    console.log("Columns added successfully!");

    console.log("Marking all existing users as email-verified...");
    const updatedCount = await prisma.$executeRawUnsafe(`
      UPDATE "users" SET "isEmailVerified" = TRUE;
    `);
    console.log(`Successfully updated ${updatedCount} users to verified status.`);

    // Fetch user rashmishara399@gmail.com raw row to verify
    const users = await prisma.$queryRawUnsafe(`
      SELECT * FROM "users" WHERE email = 'rashmishara399@gmail.com';
    `);
    console.log("Verification of user row in DB:", JSON.stringify(users, null, 2));

  } catch (error) {
    console.error("Error applying database changes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
