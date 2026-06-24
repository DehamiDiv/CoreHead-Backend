const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comments...');

  // Get some posts to link comments to
  const posts = await prisma.post.findMany({ take: 3 });

  if (posts.length === 0) {
    console.log('No posts found. Please create some posts first.');
    return;
  }

  const sampleComments = [
    {
      content: "test commet",
      userName: "Kaveesh Senevirathne",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kaveesh",
      postId: posts[0].id,
      status: "approved",
      createdAt: new Date('2026-03-10T20:32:00')
    },
    {
      content: "This is a interesting blog..",
      userName: "Ahinsa Jayakodi",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahinsa",
      postId: posts[1]?.id || posts[0].id,
      status: "approved",
      createdAt: new Date('2026-03-10T16:44:00')
    },
    {
      content: "Interesting.",
      userName: "Ahinsa Kavindi",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kavindi",
      postId: posts[2]?.id || posts[0].id,
      status: "approved",
      createdAt: new Date('2026-01-30T16:19:00')
    },
    {
      content: "This is the best",
      userName: "Kaveesh Senevirathne",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kaveesh",
      postId: posts[2]?.id || posts[0].id,
      status: "approved",
      createdAt: new Date('2026-01-30T16:18:00')
    }
  ];

  for (const comment of sampleComments) {
    await prisma.comment.create({
      data: comment
    });
  }

  console.log('Successfully seeded 4 comments.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
