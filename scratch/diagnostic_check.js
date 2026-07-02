const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.posts.count();
    const mediaCount = await prisma.media.count();
    const settingCount = await prisma.setting.count();

    console.log('--- Database Status ---');
    console.log(`Users: ${userCount}`);
    console.log(`Posts: ${postCount}`);
    console.log(`Media: ${mediaCount}`);
    console.log(`Settings: ${settingCount}`);
    console.log('-----------------------');

    if (postCount > 0) {
      const samplePosts = await prisma.posts.findMany({ take: 2 });
      console.log('Sample Posts:', JSON.stringify(samplePosts, null, 2));
    }
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
