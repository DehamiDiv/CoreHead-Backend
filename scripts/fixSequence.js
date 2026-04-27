const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Reset the sequence so the next auto-incremented id doesn't conflict
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"users"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "users";`
  );
  console.log('✅ Sequence reset successfully. Now run: node scripts/seedAdmin.js');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
