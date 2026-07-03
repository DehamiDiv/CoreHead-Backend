const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdminUser(email, password) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (existing) {
    console.log(`User already exists: ${existing.email} | Role: ${existing.role}`);
    const updated = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true
      },
    });
    console.log(`Updated admin details for: ${updated.email}`);
  } else {
    console.log(`Creating new Admin user: ${email}...`);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true
      },
    });
    console.log(`✅ Admin user created successfully: ${user.email}`);
  }
}

async function main() {
  await seedAdminUser('dehamidivyanjali166@gmail.com', 'Admin@1234');
  await seedAdminUser('admin@corehead.com', 'Admin@CoreHead2026');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
