const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const updatedUser = await prisma.user.updateMany({
      data: { isEmailVerified: true },
    });
    console.log(`✅ Success! Verified ${updatedUser.count} users.`);
    console.log(`You can now log in normally to the Admin Dashboard.`);
  } catch (error) {
    console.error("❌ Error updating users:", error.message);
    console.log("Did you run 'npx prisma db push' and 'npx prisma generate' first?");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
