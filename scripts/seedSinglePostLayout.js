// scripts/seedSinglePostLayout.js
// Run once to insert the single-post layout into the DB:
//   node scripts/seedSinglePostLayout.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SINGLE_POST_LAYOUT = {
  sections: [
    {
      // Matches the .type-hero .post-hero CSS
      type:      'hero',
      className: 'post-hero',
      bindings: {
        image:    'field:coverImage', // Or field:imageUrl if you use that in your schema
        category: 'field:category',
        title:    'field:title',
      },
    },
    {
      // Matches the .type-html .post-body CSS
      type:      'html',
      className: 'post-body',
      bindings: {
        content: 'field:content',
      },
    },
    {
      // Matches the .type-authorbox .author-box CSS
      type:      'authorbox',
      className: 'author-box',
      bindings: {
        name:        'field:author.name', // You might need to adjust this depending on how you expand the user/author model
        description: 'static:Written by an amazing author.',
      },
    },
  ],
};

async function main() {
  const layout = await prisma.pageLayout.upsert({
    where:  { slug: 'single-post' },
    update: { layout: SINGLE_POST_LAYOUT },
    create: {
      slug:   'single-post',
      name:   'Single Post Layout',
      layout: SINGLE_POST_LAYOUT,
      isActive: true, // Assuming you added this to PageLayout model
    },
  });

  console.log(`✅ Seeded layout: ${layout.slug} (id: ${layout.id})`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
