const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'dehamidivyanjali166@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
  } else {
    console.log(`User found: ${user.email}, Role: ${user.role}`);
    
    if (user.role !== 'admin') {
      console.log('Updating user to admin...');
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'admin' }
      });
      console.log(`User updated successfully to: ${updatedUser.role}`);
    } else {
      console.log('User is already an admin.');
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
