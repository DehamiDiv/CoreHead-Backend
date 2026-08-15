const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    console.log("=== Users in Database ===");
    console.log(JSON.stringify(users, null, 2));

    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true
      }
    });
    console.log("=== Sites in Database ===");
    console.log(JSON.stringify(sites, null, 2));

  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
