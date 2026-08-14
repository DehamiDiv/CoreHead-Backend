const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = ['Post', 'users', 'Template', 'TemplateHistory', 'Binding', 'PageLayout', 'comments'];
    for (const table of tables) {
      console.log(`\n=== Table: ${table} ===`);
      const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '${table}';
      `);
      console.log(JSON.stringify(columns, null, 2));
    }
  } catch (error) {
    console.error("Error inspecting database tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
