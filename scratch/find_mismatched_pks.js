const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const pks = await prisma.$queryRawUnsafe(`
      SELECT 
        c.table_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage c 
          ON c.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public';
    `);
    console.log("Primary Keys in Database:", JSON.stringify(pks, null, 2));
  } catch (error) {
    console.error("Error finding PK constraints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
