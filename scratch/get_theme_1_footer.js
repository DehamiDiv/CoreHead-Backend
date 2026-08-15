const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          contains: 'theme-1_footer'
        }
      }
    });
    console.log("=== Matching Settings ===");
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
