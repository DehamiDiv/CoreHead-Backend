const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@corehead.com';
  const password = 'Admin@CoreHead2026'; // Meets new strong password requirements

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log('Admin already exists. Updating password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'admin' }
    });
    console.log('Admin password updated successfully.');
  } else {
    console.log('Creating new Admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('Admin user created successfully.');
  }

  console.log('-----------------------------------');
  console.log('Email: ' + email);
  console.log('Password: ' + password);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
