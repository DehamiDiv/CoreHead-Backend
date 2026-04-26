np// scripts/seedBlogLayout.js
// Run once to insert the blog-loop layout into the DB:
//   node scripts/seedBlogLayout.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BLOG_LOOP_LAYOUT = {
  sections: [
    {
      type:      'heading',
      className: 'type-heading',
      bindings: {
        text: 'static:Blog',
      },
    },
    {
      type:      'loop',
      className: 'rendered-loop',
      itemTemplate: {
        type:      'card',
        className: 'post-card',
        bindings: {
          image:      'field:coverImage',
          title:      'field:title',
          excerpt:    'field:excerpt',
          meta:       'field:category',
          href:       'field:slug',
          hrefPrefix: '/blog/',
        },
      },
    },
  ],
};

async function main() {
  const layout = await prisma.pageLayout.upsert({
    where:  { slug: 'blog-loop' },
    update: { layout: BLOG_LOOP_LAYOUT },
    create: {
      slug:   'blog-loop',
      name:   'Blog Archive Loop',
      layout: BLOG_LOOP_LAYOUT,
    },
  });

  console.log(`✅ Seeded layout: ${layout.slug} (id: ${layout.id})`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());