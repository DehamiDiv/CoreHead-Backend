const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'users' 
     ORDER BY ordinal_position;`
  );
  console.log('\n📋 Columns in "users" table:');
  cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
