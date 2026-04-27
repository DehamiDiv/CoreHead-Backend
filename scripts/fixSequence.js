const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Reset the sequence so the next auto-incremented id doesn't conflict
  // Try to detect the actual table name in Postgres
  // Prisma may have created it as "User" (capital U) before @@map("users") was added
  const tables = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('User', 'users');`
  );
  console.log('Tables found:', tables);

  if (tables.length > 0) {
    const tableName = tables[0].tablename;
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "${tableName}";`
    );
    console.log(`✅ Sequence reset for table: ${tableName}`);
  } else {
    console.log('❌ No users table found in public schema!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
