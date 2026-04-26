const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const email = 'ghhjjjjj@gmail.com';
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        role: 'admin',
        password: hashedPassword 
      },
      create: {
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('User updated/created successfully:', JSON.stringify(user, null, 2));
    console.log('New Password is: password123');
  } catch (err) {
    console.error('Error updating user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
