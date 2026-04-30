const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin@Corehead2026';
  const hashed = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { email: 'dehamidivyanjali166@gmail.com' },
    data: { password: hashed, role: 'admin' }
  });

  console.log('✅ Admin user updated:');
  console.log('  Email:', updated.email);
  console.log('  Role:', updated.role);
  console.log('  Password set to:', newPassword);
}

main().catch(console.error).finally(() => prisma.$disconnect());
