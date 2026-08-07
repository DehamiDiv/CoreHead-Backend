const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const avatarUrl = '/uploads/1777523992998-software-developer.avif';
  
  // Wait, I can use the Prisma client if it has avatar
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'piyasooriyapipuni@gmail.com' },
      data: { avatar: avatarUrl }
    });
    console.log(`Successfully updated avatar for ${updatedUser.email} to ${avatarUrl}`);
  } catch (error) {
    console.error("Prisma update failed:", error.message);
    // fallback to raw sql
    await prisma.$executeRaw`UPDATE users SET avatar = ${avatarUrl} WHERE email = 'piyasooriyapipuni@gmail.com'`;
    console.log(`Successfully updated avatar via raw SQL`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
