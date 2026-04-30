const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function test() {
  const email = 'dehamidivyanjali166@gmail.com';
  const password = 'Admin@Corehead2026';
  
  console.log('\n🔍 Testing login flow...');
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('❌ User not found in DB');
    return;
  }
  console.log('✅ User found:', user.email, '| Role:', user.role);
  
  const match = await bcrypt.compare(password, user.password);
  console.log('✅ Password match:', match ? '✅ YES - Login will work!' : '❌ NO - Password mismatch');
}

test().catch(console.error).finally(() => prisma.$disconnect());
