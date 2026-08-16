const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding templates...');

  // Get the admin user
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['admin', 'ADMIN'] } }
  });

  if (!admin) {
    console.error('No admin user found. Please run seedAdmin.js first.');
    return;
  }

  // Create default mock templates
  const count = await prisma.template.createMany({
    data: [
      {
        name: 'Modern Single Post Layout',
        type: 'single-post',
        category: 'global_default',
        status: 'published',
        layoutJson: {
          sections: [
            {
              type: 'hero',
              className: 'post-hero',
              bindings: {
                image: 'field:coverImage',
                category: 'field:category',
                title: 'field:title'
              }
            },
            {
              type: 'html',
              className: 'post-body',
              bindings: {
                content: 'field:content'
              }
            }
          ]
        },
        authorId: admin.id,
        version: 1,
        updatedAt: new Date()
      },
      {
        name: 'Standard Blog Loop Layout',
        type: 'blog-loop',
        category: 'global_default',
        status: 'published',
        layoutJson: {
          sections: [
            {
              type: 'heading',
              className: 'type-heading',
              bindings: {
                text: 'static:Blog Archive'
              }
            },
            {
              type: 'loop',
              className: 'rendered-loop',
              itemTemplate: {
                type: 'card',
                className: 'post-card',
                bindings: {
                  image: 'field:coverImage',
                  title: 'field:title',
                  excerpt: 'field:excerpt'
                }
              }
            }
          ]
        },
        authorId: admin.id,
        version: 1,
        updatedAt: new Date()
      }
    ]
  });

  console.log(`Seeded ${count.count} templates successfully!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
