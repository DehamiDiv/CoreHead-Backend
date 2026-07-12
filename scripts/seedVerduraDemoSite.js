/**
 * seedVerduraDemoSite.js
 *
 * Creates a complete evaluation demo tenant:
 *   Site: Verdura (slug: verdura)
 *   Nature theme branding, categories, 8 published posts, About + Contact pages
 *
 * Usage (from CoreHead-Backend):
 *   node scripts/seedVerduraDemoSite.js
 *
 * Optional env:
 *   DEMO_OWNER_EMAIL=you@example.com   (defaults to first user / admin@corehead.com)
 */

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SITE_NAME = 'Verdura';
const SITE_SLUG = 'verdura';
const THEME_ID = 'theme-1';

const CATEGORIES = [
  { name: 'Plants & Gardens', slug: 'plants-gardens', description: 'Growing food, flowers, and green spaces at home' },
  { name: 'Eco Living', slug: 'eco-living', description: 'Practical sustainability for everyday life' },
  { name: 'Wildlife', slug: 'wildlife', description: 'Conservation, species, and ethical nature' },
  { name: 'Environment', slug: 'environment', description: 'Climate, ecosystems, and planetary health' },
  { name: 'Nature Photography', slug: 'nature-photography', description: 'Camera craft and outdoor storytelling' },
  { name: 'Outdoor Adventures', slug: 'outdoor-adventures', description: 'Trails, travel, and time outside' },
  { name: 'Aquatic Plants', slug: 'aquatic-plants', description: 'Planted tanks and water gardens' },
];

const POSTS = [
  {
    title: "Beginner's Guide to Planting a Vegetable Garden from Scratch",
    slug: 'beginners-guide-vegetable-garden',
    excerpt:
      "Learn how to start your first vegetable garden with this complete beginner-friendly guide covering soil prep, plant selection, and ongoing care.",
    category: 'Plants & Gardens',
    // Elegant cover set (see scripts/updateVerduraPostCovers.js for sources)
    coverImage: '/uploads/verdura-cover-vegetable-garden.jpg',
    featured: true,
    content: `<h2>Getting Started with Your Vegetable Garden</h2>
<p>Starting a vegetable garden is one of the most rewarding experiences you can have. Whether you have a sprawling backyard or just a small balcony, growing your own food connects you to nature and provides fresh, healthy produce for your family.</p>
<h3>Choosing the Right Location</h3>
<p>Most vegetables need at least 6–8 hours of direct sunlight per day. Choose a spot that gets morning sun and is protected from harsh afternoon winds. Good drainage is essential — avoid low-lying areas where water tends to pool.</p>
<h3>Preparing Your Soil</h3>
<p>Healthy soil is the foundation of a productive garden. Start by testing your soil's pH level (most vegetables prefer 6.0–7.0). Add compost or well-rotted manure to improve soil structure, drainage, and nutrient content.</p>
<h3>Best Vegetables for Beginners</h3>
<p>Start with easy-to-grow varieties like tomatoes, lettuce, radishes, green beans, and herbs like basil and mint. These are forgiving plants that produce well even with minimal experience.</p>
<blockquote>"The glory of gardening: hands in the dirt, head in the sun, heart with nature." — Alfred Austin</blockquote>
<p>Remember, every expert gardener was once a beginner. Start small, learn from your mistakes, and enjoy the journey of growing your own food.</p>`,
  },
  {
    title: "Solar Energy for Your Home: A Beginner's Guide to Going Green",
    slug: 'solar-energy-home-guide',
    excerpt:
      'Learn how to harness solar power for your home, reduce energy costs, and contribute to a sustainable future with renewable energy solutions.',
    category: 'Eco Living',
    coverImage: '/uploads/verdura-cover-solar-energy.jpg',
    featured: false,
    content: `<h2>Why Solar Energy Matters</h2>
<p>Solar energy is no longer a futuristic concept — it's a practical, affordable solution for homeowners looking to reduce their carbon footprint and energy bills.</p>
<h3>How Solar Panels Work</h3>
<p>Solar panels convert sunlight into electricity using photovoltaic (PV) cells. DC electricity is converted to AC for home use.</p>
<h3>Cost and Savings</h3>
<p>Most homeowners see ROI within 5–8 years. Incentives and net metering can significantly reduce costs while increasing property value.</p>`,
  },
  {
    title: 'Organic Gardening 101: Growing Your Own Vegetables at Home',
    slug: 'organic-gardening-101',
    excerpt:
      'Start your organic gardening journey with this complete guide to growing fresh, healthy vegetables without synthetic chemicals.',
    category: 'Plants & Gardens',
    coverImage: '/uploads/verdura-cover-organic-gardening.jpg',
    featured: false,
    content: `<h2>What is Organic Gardening?</h2>
<p>Organic gardening grows plants without synthetic fertilizers, pesticides, or GMOs — using compost, companion planting, and biological pest control.</p>
<h3>Building Healthy Soil Naturally</h3>
<p>Feed the soil with compost, leaf mulch, and natural amendments. Healthy soil produces resilient plants.</p>
<h3>Natural Pest Control</h3>
<p>Encourage ladybugs and lacewings, plant marigolds, and use neem oil when needed.</p>`,
  },
  {
    title: 'Protecting Endangered Species: Conservation Efforts That Are Making a Difference',
    slug: 'protecting-endangered-species',
    excerpt:
      'Discover inspiring conservation success stories and learn how global efforts are saving endangered species.',
    category: 'Wildlife',
    coverImage: '/uploads/verdura-cover-endangered-species.jpg',
    featured: true,
    content: `<h2>The State of Wildlife Conservation</h2>
<p>Dedicated conservationists, scientists, and communities protect species from snow leopards to sea turtles.</p>
<h3>Success Stories</h3>
<p>The giant panda was downlisted from Endangered to Vulnerable. Bald eagles recovered after the ban of DDT.</p>
<h3>What You Can Do</h3>
<p>Support conservation organisations, cut single-use plastics, choose sustainable products, and educate others.</p>
<blockquote>"In the end, we will conserve only what we love." — Baba Dioum</blockquote>`,
  },
  {
    title: 'How to Photograph Wildlife in Their Natural Habitat',
    slug: 'wildlife-photography-guide',
    excerpt:
      'Learn essential wildlife photography techniques including equipment, camera settings, animal behaviour, and ethics.',
    category: 'Nature Photography',
    coverImage: '/uploads/verdura-cover-wildlife-photography.jpg',
    featured: false,
    content: `<h2>The Art of Wildlife Photography</h2>
<p>Wildlife photography demands patience, technical skill, and deep respect for animals.</p>
<h3>Essential Equipment</h3>
<p>A 200–600mm telephoto lens, sturdy support, and fast autofocus help you capture natural behaviour safely.</p>
<h3>Ethical Guidelines</h3>
<p>Never disturb wildlife for a shot. Maintain distance, avoid baiting, and put animal welfare first.</p>`,
  },
  {
    title: 'Climate Change and Its Impact on Global Ecosystems',
    slug: 'climate-change-impact-ecosystems',
    excerpt:
      'Explore how climate change reshapes coral reefs, forests, and ecosystems worldwide — and what we can do.',
    category: 'Environment',
    coverImage: '/uploads/verdura-cover-climate-ecosystems.jpg',
    featured: true,
    content: `<h2>A Changing Planet</h2>
<p>Rising temperatures and extreme weather are reshaping ecosystems at an unprecedented rate.</p>
<h3>Impact on Coral Reefs</h3>
<p>Warming oceans bleach corals; acidification weakens reef structures. Over half of coral cover is already lost.</p>
<h3>Forests Under Threat</h3>
<p>Wildfires, pests, and drought threaten forests that store carbon and host biodiversity.</p>
<h3>Taking Action</h3>
<p>Cut emissions, support renewables, protect natural carbon sinks, and adapt how we live. Act now.</p>`,
  },
  {
    title: "Exploring the World's Most Breathtaking Hiking Trails",
    slug: 'breathtaking-hiking-trails',
    excerpt:
      'From the Inca Trail to the Tour du Mont Blanc — spectacular hiking routes for outdoor enthusiasts.',
    category: 'Outdoor Adventures',
    coverImage: '/uploads/verdura-cover-hiking-trails.jpg',
    featured: false,
    content: `<h2>Trails That Will Take Your Breath Away</h2>
<p>These walks offer more than exercise — they create lasting connection with wilderness.</p>
<h3>Inca Trail, Peru</h3>
<p>Cloud forests, alpine tundra, and ancient ruins ending at Machu Picchu.</p>
<h3>Tour du Mont Blanc</h3>
<p>Alpine scenery across France, Italy, and Switzerland.</p>
<h3>Milford Track, New Zealand</h3>
<p>Rainforests, waterfalls, and mountain passes in Fiordland National Park.</p>`,
  },
  {
    title: 'The Healing Power of Aquatic Plants in Home Aquariums',
    slug: 'aquatic-plants-home-aquariums',
    excerpt:
      'Discover how aquatic plants transform aquariums into thriving ecosystems with natural filtration and calm beauty.',
    category: 'Aquatic Plants',
    coverImage: '/uploads/verdura-cover-aquatic-plants.jpg',
    featured: false,
    content: `<h2>Why Aquatic Plants Matter</h2>
<p>Live plants improve water quality, oxygen levels, and natural habitat — reducing stress for fish and people.</p>
<h3>Beginner-Friendly Plants</h3>
<p>Java Fern, Anubias, Amazon Sword, and Java Moss are hardy and low-maintenance.</p>
<h3>Setting Up a Planted Tank</h3>
<p>Use nutrient-rich substrate, 8–10 hours of light daily, and add CO₂ as you gain experience.</p>`,
  },
];

const ABOUT_HTML = `<section style="max-width:720px;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;line-height:1.7;color:#14532d">
  <h1 style="font-size:2rem;margin-bottom:0.5rem">About Verdura</h1>
  <p style="color:#4d7c5a;margin-bottom:1.5rem">Stories of nature, sustainability, and conscious living.</p>
  <p>Verdura is a digital magazine for people who want to live closer to the natural world — whether that means planting a balcony garden, photographing wildlife, or making greener choices at home.</p>
  <p>This site is powered by <strong>CoreHead</strong>, a multi-tenant AI-assisted CMS. Each organisation gets its own workspace, branding, posts, media library, and public URL.</p>
  <h2 style="margin-top:2rem;font-size:1.35rem">What you'll find here</h2>
  <ul>
    <li>Practical gardening and eco-living guides</li>
    <li>Wildlife conservation stories</li>
    <li>Outdoor adventure inspiration</li>
    <li>Photography tips from the field</li>
  </ul>
  <p style="margin-top:1.5rem">Thank you for reading. Grow something good today.</p>
</section>`;

const CONTACT_HTML = `<section style="max-width:720px;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;line-height:1.7;color:#14532d">
  <h1 style="font-size:2rem;margin-bottom:0.5rem">Contact Verdura</h1>
  <p style="color:#4d7c5a;margin-bottom:1.5rem">We'd love to hear from readers, contributors, and partners.</p>
  <p><strong>Editorial:</strong> hello@verdura.demo</p>
  <p><strong>Partnerships:</strong> partners@verdura.demo</p>
  <p><strong>Location:</strong> Colombo, Sri Lanka (demo address for evaluation)</p>
  <p style="margin-top:1.5rem">For project evaluation, this page demonstrates CoreHead custom pages published at <code>/s/{slug}/p/{pageSlug}</code>.</p>
</section>`;

function resolveLogoPath() {
  const candidates = [
    path.join(__dirname, '../../corehead-frontend/frontend/public/demo/verdura-icon.svg'),
    path.join(__dirname, '../../corehead-frontend/frontend/public/demo/verdura-logo.svg'),
    path.join(__dirname, '../public/uploads/logo.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Prefer backend /uploads paths (served by Express + resolveMediaUrl).
 * Files are copied into CoreHead-Backend/public/uploads by the seed (or exist already).
 */
function logoPublicUrl() {
  return '/uploads/verdura-logo.png';
}

function headerLogoUrl() {
  return '/uploads/verdura-logo.png';
}

function footerLogoUrl() {
  return '/uploads/verdura-logo.png';
}

function ensureUploadLogos() {
  const uploadsDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const pairs = [
    ['verdura-icon.svg', '../../corehead-frontend/frontend/public/demo/verdura-icon.svg'],
    ['verdura-icon.jpg', '../../corehead-frontend/frontend/public/demo/verdura-icon.jpg'],
    ['verdura-logo.svg', '../../corehead-frontend/frontend/public/demo/verdura-logo.svg'],
    ['verdura-logo-light.svg', '../../corehead-frontend/frontend/public/demo/verdura-logo-light.svg'],
    ['verdura-icon-editorial.svg', '../../corehead-frontend/frontend/public/demo/verdura-icon-editorial.svg'],
    ['verdura-logo-editorial.svg', '../../corehead-frontend/frontend/public/demo/verdura-logo-editorial.svg'],
    ['verdura-logo-editorial-dark.svg', '../../corehead-frontend/frontend/public/demo/verdura-logo-editorial-dark.svg'],
  ];
  for (const [name, rel] of pairs) {
    const dest = path.join(uploadsDir, name);
    const src = path.join(__dirname, rel);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`📎 Copied logo → public/uploads/${name}`);
    }
  }
}

async function upsertSetting(siteId, key, value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  await prisma.setting.upsert({
    where: {
      siteId_key: { siteId, key },
    },
    create: { siteId, key, value: raw },
    update: { value: raw },
  });
}

async function resolveOwner() {
  const email = process.env.DEMO_OWNER_EMAIL;
  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) return u;
    console.warn(`DEMO_OWNER_EMAIL=${email} not found; falling back.`);
  }

  let user =
    (await prisma.user.findUnique({ where: { email: 'admin@corehead.com' } })) ||
    (await prisma.user.findFirst({ where: { role: 'admin' } })) ||
    (await prisma.user.findFirst());

  if (!user) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Verdura@Demo2026', 10);
    user = await prisma.user.create({
      data: {
        email: 'demo@verdura.demo',
        password: hashed,
        role: 'admin',
        isEmailVerified: true,
        name: 'Ava Green',
        designation: 'Editor-in-Chief',
        bio: 'Writer and naturalist covering gardens, climate, and wildlife for Verdura.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AvaGreen',
      },
    });
    console.log('Created owner user: demo@verdura.demo / Verdura@Demo2026');
  }

  // Polish existing owner display name if empty
  if (!user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Ava Green',
        designation: user.designation || 'Editor-in-Chief',
        bio:
          user.bio ||
          'Writer and naturalist covering gardens, climate, and wildlife for Verdura.',
      },
    });
  }

  return user;
}

async function main() {
  console.log('\n🌿 Seeding Verdura evaluation demo site...\n');

  ensureUploadLogos();

  const owner = await resolveOwner();
  console.log(`👤 Owner: ${owner.email} (id=${owner.id})`);

  let site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });
  const logo = logoPublicUrl();

  if (!site) {
    site = await prisma.site.create({
      data: {
        name: SITE_NAME,
        slug: SITE_SLUG,
        ownerId: owner.id,
        status: 'active',
        logo,
        plan: 'premium',
        planStatus: 'active',
      },
    });
    console.log(`✅ Created site: ${SITE_NAME} (/s/${SITE_SLUG}) id=${site.id}`);
  } else {
    site = await prisma.site.update({
      where: { id: site.id },
      data: {
        name: SITE_NAME,
        // Always refresh demo logo so /demo → /uploads fix applies
        logo,
        status: 'active',
      },
    });
    console.log(`♻️  Updated existing site: ${SITE_NAME} id=${site.id}`);
  }

  // Membership for owner
  await prisma.siteMember.upsert({
    where: {
      siteId_userId: { siteId: site.id, userId: owner.id },
    },
    create: { siteId: site.id, userId: owner.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  });

  // Website metadata (Admin → Settings → Website Settings)
  await upsertSetting(site.id, 'website_metadata', {
    websiteName: SITE_NAME,
    pageTitle: 'Verdura — Nature, Gardens & Sustainable Living',
    description:
      'Verdura is a nature and sustainable living magazine. Practical gardening guides, wildlife conservation stories, eco living tips, and outdoor adventure inspiration for people who care about the planet.',
    favicon: '/uploads/verdura-icon.svg',
    ogImage: '/uploads/verdura-hero-home.jpg',
    scripts: [],
  });
  console.log('✅ Website metadata saved');

  // Branding settings (Nature theme)
  await upsertSetting(site.id, 'active_theme', { themeId: THEME_ID, id: THEME_ID });
  await upsertSetting(site.id, `theme_${THEME_ID}_colours`, {
    primary: '#1a3d2e',
    background: '#f4f1ea',
    foreground: '#1a3d2e',
    accent: '#c5a572',
    card: '#ffffff',
    cardForeground: '#1a3d2e',
    muted: '#5c6b5f',
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_header`, {
    headerBg: '#1a3d2e',
    headerFont: '#f5f0e6',
    headerLogo: headerLogoUrl(),
    ctaText: 'Explore stories',
    ctaUrl: `/s/${SITE_SLUG}/blog`,
    ctaBg: '#f5f0e6',
    ctaColor: '#1a3d2e',
    navLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_footer`, {
    footerBg: '#0f2e22',
    footerFont: '#c5d5c0',
    footerLogo: footerLogoUrl(),
    footerDescription:
      'Verdura — a nature & beauty journal. Gardens, wildlife, and conscious living, told with quiet luxury.',
    copyrightText: '© 2026 Verdura Studio. All rights reserved.',
    quickLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_font`, { font: 'georgia' });
  console.log('✅ Branding (Nature theme) applied');

  // Public home layout + all section copy (Appearance → Homepage)
  await upsertSetting(site.id, 'home_layout', {
    homeStyle: 'nature',
    eyebrow: 'Nature · Beauty · Collections',
    tagline:
      'A nature & beauty journal — gardens, wildlife, and conscious living, told with quiet luxury.',
    heroImage: '/demo/verdura-hero-editorial.png',
    captionLeft: 'New stories with beauty\nNature collections',
    captionRight: 'Verdura studio\n2026',
    featuredEyebrow: 'This week',
    featuredTitle: 'Featured stories',
    sideRailLabel: 'More to explore',
    pillarsEyebrow: 'Why Verdura',
    pillarsTitle: 'A magazine built for modern readers',
    pillarsBody:
      'Beautiful public pages, published stories only, and branding that feels like your own product — not a template dump.',
    pillars: [
      {
        title: 'Grow greener',
        body: 'Practical gardening and eco-living guides you can use this weekend.',
      },
      {
        title: 'Protect wildlife',
        body: 'Conservation stories and ethical ways to reconnect with the wild.',
      },
      {
        title: 'See the planet',
        body: 'Outdoor adventures and photography tips from the field.',
      },
    ],
    latestEyebrow: 'Latest',
    latestTitle: 'From the journal',
    ctaEyebrow: 'Start reading',
    ctaTitle: 'Grow something good today',
    ctaBody:
      'Browse the full archive of published stories, guides, and field notes.',
    ctaButton: 'Explore all posts',
  });
  console.log('✅ Home layout sections filled (nature editorial)');

  // Categories
  for (const cat of CATEGORIES) {
    const existing = await prisma.categories.findFirst({
      where: { siteId: site.id, slug: cat.slug },
    });
    if (existing) {
      await prisma.categories.update({
        where: { id: existing.id },
        data: { name: cat.name, description: cat.description },
      });
    } else {
      try {
        await prisma.categories.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            siteId: site.id,
          },
        });
      } catch (e) {
        // unique name/slug race — ignore
        console.warn(`  category skip: ${cat.name} (${e.message})`);
      }
    }
  }
  console.log(`✅ Categories: ${CATEGORIES.length}`);

  // Posts
  let created = 0;
  let updated = 0;
  for (const post of POSTS) {
    const existing = await prisma.post.findFirst({
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
    if (existing) {
      await prisma.post.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.post.create({ data });
      created++;
    }
  }
  console.log(`✅ Posts created=${created} updated=${updated}`);

  // Pages
  for (const page of [
    { name: 'About', slug: 'about', htmlContent: ABOUT_HTML },
    { name: 'Contact', slug: 'contact', htmlContent: CONTACT_HTML },
  ]) {
    const existing = await prisma.page.findFirst({
      where: { siteId: site.id, slug: page.slug },
    });
    const data = {
      name: page.name,
      slug: page.slug,
      htmlContent: page.htmlContent,
      status: 'Published',
      siteId: site.id,
    };
    if (existing) {
      await prisma.page.update({ where: { id: existing.id }, data });
    } else {
      await prisma.page.create({ data });
    }
  }
  console.log('✅ Pages: About, Contact');

  const logoFile = resolveLogoPath();
  if (logoFile) {
    console.log(`📎 Logo asset found: ${logoFile}`);
  } else {
    console.log('📎 Logo SVG expected at frontend public/demo/verdura-icon.svg');
  }

  console.log(`
🎉 Verdura demo ready!

  Public home:  /s/${SITE_SLUG}
  Blog:         /s/${SITE_SLUG}/blog
  About:        /s/${SITE_SLUG}/p/about
  Contact:      /s/${SITE_SLUG}/p/contact

  Owner: ${owner.email}
  Site id: ${site.id}

  Start frontend + backend, then open http://localhost:3000/s/${SITE_SLUG}
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
