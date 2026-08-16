const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const posts = await p.post.findMany({
    take: 8,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      status: true,
    },
  });
  for (const post of posts) {
    const c = post.coverImage || '';
    console.log(
      JSON.stringify({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        coverPreview: c ? c.slice(0, 80) : null,
        coverLen: c.length,
        isDataUrl: c.startsWith('data:'),
        isUpload: c.includes('/uploads/'),
      })
    );
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => p.$disconnect());
