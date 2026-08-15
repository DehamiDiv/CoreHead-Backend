const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if Technology category exists or create it
  let tech = await prisma.categories.findFirst({ where: { name: 'Technology' } });
  if (!tech) {
    tech = await prisma.categories.create({
      data: { name: 'Technology', slug: 'technology', description: 'Tech posts' }
    });
  }
  console.log('Parent Tech Category:', tech);

  // Check if CyberSecurity category exists or create/update it
  let cyber = await prisma.categories.findFirst({ where: { name: 'CyberSecurity' } });
  if (!cyber) {
    cyber = await prisma.categories.create({
      data: {
        name: 'CyberSecurity',
        slug: 'cybersecurity',
        description: 'Explore cybersecurity tips',
        parentId: tech.id
      }
    });
  } else {
    cyber = await prisma.categories.update({
      where: { id: cyber.id },
      data: { parentId: tech.id }
    });
  }

  console.log('Updated CyberSecurity Category with parentId:', cyber);
}

main().catch(console.error).finally(() => prisma.$disconnect());
