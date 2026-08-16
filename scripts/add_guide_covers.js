const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const covers = {
    'getting-started-with-corehead': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    'how-to-use-the-drag-drop-builder': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    'setting-up-your-blog-theme': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    'managing-posts-and-categories': 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=800&q=80',
    'inviting-team-members': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    'building-a-blog-archive-page': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'creating-a-custom-single-post-template': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
    'using-the-media-library': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
    'setting-up-a-custom-domain': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'enabling-comments-on-your-blog': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  };
  
  for (const [slug, img] of Object.entries(covers)) {
    const r = await prisma.post.updateMany({ where: { slug }, data: { coverImage: img } });
    console.log(slug, '=>', r.count, 'updated');
  }
  await prisma.$disconnect();
  console.log('Done!');
}
run();
