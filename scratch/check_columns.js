const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`;
  console.log('Columns in users table:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
