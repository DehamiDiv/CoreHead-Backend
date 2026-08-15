const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.setting.findMany();
    console.log("=== Settings in Database ===");
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error fetching settings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
