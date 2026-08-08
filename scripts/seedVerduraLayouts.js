/**
 * seedVerduraLayouts.js
 *
 * Creates published Blog Archive + Single Post layouts for the Verdura site
 * (builder block format used by PublicPageRenderer / admin builder).
 *
 * Usage (from CoreHead-Backend):
 *   node scripts/seedVerduraLayouts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SITE_SLUG = 'verdura';

/** Nature-magazine archive: hero feature + grid + newsletter */
const BLOG_ARCHIVE_LAYOUT = {
  blocks: [
    {
      id: 'v-arch-kicker',
      type: 'Paragraph',
      content: 'Journal',
      styles: {
        color: 'var(--site-primary)',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.2em',
        marginBottom: '0.5rem',
      },
    },
    {
      id: 'v-arch-title',
      type: 'Heading',
      content: 'The Verdura Journal',
      styles: {
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: '900',
        color: 'var(--site-ink)',
        marginBottom: '0.75rem',
        letterSpacing: '-0.02em',
      },
    },
    {
      id: 'v-arch-sub',
      type: 'Paragraph',
      content:
        'Stories of gardens, wildlife, eco living, and outdoor adventure — for people who care about the planet.',
      styles: {
        color: 'var(--site-muted)',
        fontSize: '1.05rem',
        lineHeight: '1.7',
        marginBottom: '2rem',
        maxWidth: '42rem',
      },
    },
    {
      id: 'v-arch-featured',
      type: 'Featured Carousel',
      content: {},
      styles: {
        marginBottom: '2.5rem',
        borderRadius: '1.5rem',
      },
    },
    {
      id: 'v-arch-latest',
      type: 'Heading',
      content: 'Latest stories',
      styles: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: 'var(--site-ink)',
        marginBottom: '1rem',
      },
    },
    {
      id: 'v-arch-grid',
      type: 'Collection List',
      content: { limit: 12, category: '' },
      styles: {
        marginTop: '0.5rem',
      },
    },
    {
      id: 'v-arch-spacer',
      type: 'Spacer',
      content: 32,
    },
    {
      id: 'v-arch-news',
      type: 'Newsletter',
      content: {
        title: 'Grow with Verdura',
        description:
          'Field notes, eco living tips, and outdoor inspiration — delivered when you need them.',
        buttonText: 'Subscribe',
      },
      styles: {
        marginTop: '1rem',
        background:
          'linear-gradient(135deg, var(--site-primary) 0%, var(--site-accent, var(--site-primary)) 50%, var(--site-ink) 100%)',
        borderRadius: '1.5rem',
      },
    },
  ],
};

/** Single article layout — full editorial post for public renderer */
const SINGLE_POST_LAYOUT = {
  blocks: [
    {
      id: 'v-post-cat',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.category' },
      styles: {
        color: 'var(--site-primary)',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.16em',
        marginBottom: '0.75rem',
      },
    },
    {
      id: 'v-post-title',
      type: 'Heading',
      content: '',
      bindings: { content: 'post.title' },
      styles: {
        fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
        fontWeight: '900',
        color: 'var(--site-ink)',
        lineHeight: '1.15',
        letterSpacing: '-0.02em',
        marginBottom: '1rem',
      },
    },
    {
      id: 'v-post-excerpt',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.excerpt' },
      styles: {
        fontSize: '1.125rem',
        color: 'var(--site-muted)',
        lineHeight: '1.7',
        marginBottom: '1.5rem',
      },
    },
    {
      id: 'v-post-cover',
      type: 'Image',
      content: '',
      bindings: { content: 'post.coverImage' },
      styles: {
        borderRadius: '1rem',
        marginBottom: '2rem',
        overflow: 'hidden',
      },
    },
    {
      id: 'v-post-body',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.contentHtml' },
      styles: {
        color: 'var(--site-ink)',
        lineHeight: '1.85',
        fontSize: '1.05rem',
      },
    },
    {
      id: 'v-post-divider',
      type: 'Divider',
      content: '',
      styles: {
        marginTop: '2.5rem',
        marginBottom: '1.5rem',
        borderColor: 'var(--site-primary-soft)',
      },
    },
    {
      id: 'v-post-quote',
      type: 'Quote',
      content: 'Nature is essential. Stories that grow with you. — Verdura',
      styles: {
        borderLeftColor: 'var(--site-accent)',
        color: 'var(--site-primary)',
        background: 'var(--site-primary-soft)',
        padding: '1rem 1.25rem',
        borderRadius: '0 0.75rem 0.75rem 0',
      },
    },
    {
      id: 'v-post-cta',
      type: 'Button',
      content: {
        text: 'Back to journal',
        url: `/s/${SITE_SLUG}/blog`,
      },
      styles: {
        marginTop: '2rem',
      },
    },
  ],
};

async function upsertTemplate({
  siteId,
  authorId,
  name,
  type,
  layoutJson,
}) {
  const existing = await prisma.templates.findFirst({
    where: {
      siteId,
      type,
      name,
    },
  });

  const data = {
    name,
    type,
    category: 'global_default',
    status: 'published',
    layoutJson,
    authorId,
    siteId,
    version: existing ? (existing.version || 1) + 1 : 1,
  };

  if (existing) {
    // Clear other global_default of same type on this site
    await prisma.templates.updateMany({
      where: {
        siteId,
        type,
        category: 'global_default',
        NOT: { id: existing.id },
      },
      data: { category: null },
    });

    const updated = await prisma.templates.update({
      where: { id: existing.id },
      data,
    });
    console.log(`♻️  Updated template: ${name} (id=${updated.id}, type=${type})`);
    return updated;
  }

  // Clear previous global defaults of this type for site
  await prisma.templates.updateMany({
    where: {
      siteId,
      type,
      category: 'global_default',
    },
    data: { category: null },
  });

  const created = await prisma.templates.create({ data });
  console.log(`✅ Created template: ${name} (id=${created.id}, type=${type})`);
  return created;
}

async function main() {
  console.log('\n📐 Seeding Verdura layouts (Blog Archive + Single Post)...\n');

  const site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });
  if (!site) {
    console.error(
      `❌ Site "${SITE_SLUG}" not found. Run seedVerduraDemoSite.js first.`
    );
    process.exit(1);
  }

  let author =
    (await prisma.user.findUnique({ where: { id: site.ownerId } })) ||
    (await prisma.user.findFirst({ where: { role: 'admin' } })) ||
    (await prisma.user.findFirst());

  if (!author) {
    console.error('❌ No user found to own templates.');
    process.exit(1);
  }

  console.log(`👤 Author: ${author.email} (id=${author.id})`);
  console.log(`🌿 Site: ${site.name} (id=${site.id})\n`);

  await upsertTemplate({
    siteId: site.id,
    authorId: author.id,
    name: 'Verdura Journal Archive',
    type: 'Blog Archive',
    layoutJson: BLOG_ARCHIVE_LAYOUT,
  });

  await upsertTemplate({
    siteId: site.id,
    authorId: author.id,
    name: 'Verdura Single Story',
    type: 'Single Post',
    layoutJson: SINGLE_POST_LAYOUT,
  });

  // Also store PageLayout rows for admin/page-layout tools that use slug keys
  for (const row of [
    {
      slug: 'blog-archive',
      name: 'Verdura Journal Archive',
      layout: BLOG_ARCHIVE_LAYOUT,
    },
    {
      slug: 'single-post',
      name: 'Verdura Single Story',
      layout: SINGLE_POST_LAYOUT,
    },
  ]) {
    const existing = await prisma.pageLayout.findFirst({
      where: { siteId: site.id, slug: row.slug },
    });
    if (existing) {
      await prisma.pageLayout.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          layout: row.layout,
          isActive: true,
        },
      });
      console.log(`♻️  PageLayout: ${row.slug}`);
    } else {
      await prisma.pageLayout.create({
        data: {
          slug: row.slug,
          name: row.name,
          layout: row.layout,
          isActive: true,
          siteId: site.id,
        },
      });
      console.log(`✅ PageLayout: ${row.slug}`);
    }
  }

  const all = await prisma.templates.findMany({
    where: { siteId: site.id },
    select: { id: true, name: true, type: true, status: true, category: true },
  });

  console.log(`
🎉 Verdura layouts ready!

  Templates (${all.length}):
${all.map((t) => `    • [${t.id}] ${t.name} — ${t.type} (${t.status}, ${t.category})`).join('\n')}

  Public:
    /s/verdura/blog          → Blog Archive layout
    /s/verdura/blog/{slug}   → Single Post layout

  Admin:
    Layouts / Templates (with Verdura site selected)
`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
