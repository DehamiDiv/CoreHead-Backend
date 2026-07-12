/**
 * Bloom — soft wellness / mental-health clinic demo site
 * Dribbble-inspired calm clinic home (Bloom layout)
 *
 *   node scripts/seedBloomDemoSite.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SITE_NAME = 'Bloom';
const SITE_SLUG = 'bloom';
const THEME_ID = 'theme-4'; // Soft Blush base — we'll override to sage wellness

const POSTS = [
  {
    title: 'Five-minute breathing when the day feels too loud',
    slug: 'five-minute-breathing',
    excerpt: 'A gentle practice you can use between meetings, messages, or restless nights.',
    category: 'Mindfulness',
    coverImage:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    featured: true,
    content: `<h2>Start where you are</h2><p>You do not need a perfect quiet room. Sit, place one hand on your chest, and count four soft breaths in and six out.</p><p>Small pauses still count as care.</p>`,
  },
  {
    title: 'How to talk to yourself on hard mornings',
    slug: 'hard-morning-self-talk',
    excerpt: 'Swap harsh scripts for kinder language without forcing toxic positivity.',
    category: 'Self-compassion',
    coverImage:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&q=80',
    featured: true,
    content: `<h2>Notice the tone</h2><p>Ask: would I speak this way to a friend? If not, rewrite one sentence with more gentleness.</p>`,
  },
  {
    title: 'Building a support circle that feels safe',
    slug: 'safe-support-circle',
    excerpt: 'Quality over quantity — choosing people who listen without fixing you.',
    category: 'Connection',
    coverImage:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
    featured: false,
    content: `<h2>Safety first</h2><p>Support is not performance. Start with one trusted person and clear boundaries.</p>`,
  },
  {
    title: 'Journal prompts for anxiety that do not overwhelm',
    slug: 'gentle-journal-prompts',
    excerpt: 'Three short prompts when full journaling feels like too much.',
    category: 'Tools',
    coverImage:
      'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80',
    featured: false,
    content: `<h2>Keep it light</h2><p>What is one thing my body needs right now? What can wait until tomorrow?</p>`,
  },
];

const CATEGORIES = [
  { name: 'Mindfulness', slug: 'mindfulness', description: 'Breath and presence' },
  { name: 'Self-compassion', slug: 'self-compassion', description: 'Kinder inner voice' },
  { name: 'Connection', slug: 'connection', description: 'Relationships and belonging' },
  { name: 'Tools', slug: 'tools', description: 'Practical wellness tools' },
];

async function upsertSetting(siteId, key, value) {
  const raw = JSON.stringify(value);
  const ex = await prisma.setting.findFirst({ where: { siteId, key } });
  if (ex) return prisma.setting.update({ where: { id: ex.id }, data: { value: raw } });
  return prisma.setting.create({ data: { siteId, key, value: raw } });
}

async function main() {
  console.log('\n🌸 Seeding Bloom wellness demo site...\n');

  let owner =
    (await prisma.user.findFirst({ where: { role: 'admin' } })) ||
    (await prisma.user.findFirst());
  if (!owner) throw new Error('No user found');

  let site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });
  if (!site) {
    site = await prisma.site.create({
      data: {
        name: SITE_NAME,
        slug: SITE_SLUG,
        ownerId: owner.id,
        status: 'active',
        logo: '/demo/bloom-icon.jpg',
        plan: 'premium',
        planStatus: 'active',
      },
    });
    console.log('Created site', site.id);
  } else {
    site = await prisma.site.update({
      where: { id: site.id },
      data: {
        name: SITE_NAME,
        status: 'active',
        logo: '/demo/bloom-icon.jpg',
      },
    });
  }

  await prisma.siteMember.upsert({
    where: { siteId_userId: { siteId: site.id, userId: owner.id } },
    create: { siteId: site.id, userId: owner.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  });

  // Soft sage wellness branding
  await upsertSetting(site.id, 'active_theme', { themeId: THEME_ID, id: THEME_ID });
  // Theme 4 · Soft Bloom — calm lavender meditation (no green)
  await upsertSetting(site.id, `theme_${THEME_ID}_colours`, {
    primary: '#7B6B9A',
    background: '#F8F6FA',
    foreground: '#2C2835',
    accent: '#C4A882',
    card: '#FFFFFF',
    cardForeground: '#2C2835',
    muted: '#8A8496',
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_header`, {
    headerBg: '#F8F6FA',
    headerFont: '#2C2835',
    headerLogo: '/demo/bloom-icon.jpg',
    ctaText: 'Start reading',
    ctaUrl: `/s/${SITE_SLUG}/blog`,
    ctaBg: '#7B6B9A',
    ctaColor: '#F8F6FA',
    navLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_footer`, {
    footerBg: '#2C2835',
    footerFont: '#D4CFE0',
    footerLogo: '/demo/bloom-icon.jpg',
    footerDescription:
      'Bloom is a calm space for mental wellness, reflection, and stories that help you breathe.',
    copyrightText: '© 2026 Bloom Care. All rights reserved.',
    quickLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_font`, { font: 'dm-sans' });

  // Bloom home layout (Dribbble-inspired wellness)
  await upsertSetting(site.id, 'home_layout', {
    homeStyle: 'bloom',
    eyebrow: 'Gentle care · Mindful living',
    tagline:
      'Bloom is a calm space for mental wellness, reflection, and stories that help you breathe.',
    heroImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&q=85',
    captionLeft: null,
    captionRight: null,
  });

  await upsertSetting(site.id, 'website_metadata', {
    websiteName: 'Bloom',
    pageTitle: 'Bloom — Mental Wellness & Gentle Care',
    description:
      'A soft space for mental health stories, mindfulness tools, and compassionate support.',
    favicon: null,
    ogImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    scripts: [],
  });

  for (const cat of CATEGORIES) {
    const ex = await prisma.categories.findFirst({
      where: { siteId: site.id, slug: cat.slug },
    });
    if (!ex) {
      try {
        await prisma.categories.create({ data: { ...cat, siteId: site.id } });
      } catch (_) {}
    }
  }

  for (const post of POSTS) {
    const ex = await prisma.post.findFirst({
      where: { siteId: site.id, slug: post.slug },
    });
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage,
      status: 'published',
      isPublished: true,
      featured: !!post.featured,
      tags: [],
      allowComments: true,
      publishedAt: new Date(),
      authorId: owner.id,
      siteId: site.id,
    };
    if (ex) await prisma.post.update({ where: { id: ex.id }, data });
    else await prisma.post.create({ data });
  }

  for (const page of [
    {
      name: 'About',
      slug: 'about',
      html: `<section style="max-width:640px;margin:0 auto;line-height:1.7;color:#2C3630"><p style="color:#3D6B54;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">About Bloom</p><h1 style="font-family:Georgia,serif;font-size:2rem;font-weight:500">Care that feels human</h1><p>Bloom is a wellness journal and soft landing place for mental health stories. We believe progress can be gentle.</p></section>`,
    },
    {
      name: 'Contact',
      slug: 'contact',
      html: `<section style="max-width:640px;margin:0 auto;line-height:1.7;color:#2C3630"><h1 style="font-family:Georgia,serif">Contact</h1><p><strong>Care desk:</strong> hello@bloom.demo</p><p>This is a CoreHead demo site for evaluation.</p></section>`,
    },
  ]) {
    const ex = await prisma.page.findFirst({
      where: { siteId: site.id, slug: page.slug },
    });
    const data = {
      name: page.name,
      slug: page.slug,
      htmlContent: page.html,
      status: 'Published',
      siteId: site.id,
    };
    if (ex) await prisma.page.update({ where: { id: ex.id }, data });
    else await prisma.page.create({ data });
  }

  console.log(`
🌸 Bloom ready!

  Public:  /s/${SITE_SLUG}
  Layout:  Bloom Wellness (home_layout = bloom)
  Open:    http://localhost:3000/s/${SITE_SLUG}

  Appearance → Home page layout → "Bloom Wellness"
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
