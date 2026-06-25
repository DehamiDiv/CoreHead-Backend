const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateChessPost() {
  try {
    const post = await prisma.post.update({
      where: { slug: 'chess' },
      data: {
        coverImage: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=1200&q=80',
      },
    });
    console.log('Successfully updated chess post:', post.title);
  } catch (error) {
    console.error('Error updating chess post:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateChessPost();
