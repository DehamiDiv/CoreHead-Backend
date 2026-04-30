const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'dehamidivyanjali166@gmail.com';
  const password = 'Admin@1234'; // Change this to your desired password
  const role = 'admin';

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`User already exists: ${existing.email} | Role: ${existing.role}`);
    if (existing.role !== 'admin') {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log(`Role updated to admin for: ${updated.email}`);
    } else {
      console.log('User is already an admin. Nothing to do.');
    }
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the admin user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email   : ${user.email}`);
  console.log(`   Role    : ${user.role}`);
  console.log(`   Password: ${password}  ← save this, it won't be shown again`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
