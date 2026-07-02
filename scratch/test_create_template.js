const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to create a test template with authorId 1...');
  try {
    const template = await prisma.template.create({
      data: {
        name: 'Test Layout',
        type: 'single_post',
        layoutJson: { blocks: [] },
        authorId: 1
      }
    });
    console.log('Success!', template);
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
