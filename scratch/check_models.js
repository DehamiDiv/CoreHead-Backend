const prisma = require('./src/models/prismaClient');

async function main() {
  console.log('Available models in Prisma Client:');
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
  console.log(models);
  
  if (prisma.users) {
    console.log('users model found.');
  } else {
    console.log('users model NOT found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
