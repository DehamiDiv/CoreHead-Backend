/**
 * seedNoctraDemoSite.js
 *
 * Entertainment demo tenant — dark theme, unique brand:
 *   Music · Drawing · Sports · Film · Gaming
 *
 * Site: Noctra (slug: noctra)  →  /s/noctra
 * Theme: Modern Dark (theme-11) with violet/pink entertainment accents
 *
 * Usage (from CoreHead-Backend):
 *   node scripts/seedNoctraDemoSite.js
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SITE_NAME = 'Noctra';
const SITE_SLUG = 'noctra';
const THEME_ID = 'theme-11'; // Modern Dark
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

const CATEGORIES = [
  { name: 'Music', slug: 'music', description: 'Beats, artists, live shows, and sound culture' },
  { name: 'Drawing & Art', slug: 'drawing-art', description: 'Illustration, digital art, and creative process' },
  { name: 'Sports', slug: 'sports', description: 'Games, athletes, and peak performance' },
  { name: 'Film & TV', slug: 'film-tv', description: 'Screens, stories, and culture after dark' },
  { name: 'Gaming', slug: 'gaming', description: 'Esports, indie titles, and virtual stages' },
  { name: 'Live Events', slug: 'live-events', description: 'Festivals, concerts, and stadium nights' },
];

const POSTS = [
  {
    title: 'Midnight Frequencies: How Underground DJs Shape the City After Dark',
    slug: 'midnight-frequencies-underground-djs',
    excerpt:
      'From warehouse raves to streaming sets — the sound of nightlife culture and the artists rewriting the dance floor.',
    category: 'Music',
    coverFile: 'noctra-cover-music-dj.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
    featured: true,
    content: `<h2>When the city sleeps, the beat wakes up</h2>
<p>Noctra’s music desk goes where the lights are lowest and the bass is loudest. Underground DJs are not just spinning tracks — they are architects of atmosphere, community, and late-night identity.</p>
<h3>Vinyl, controllers, and the live mix</h3>
<p>Modern sets blend classic vinyl craft with digital precision. The best nights feel improvisational: reading the room, stretching a break, dropping silence just long enough for the crowd to breathe.</p>
<h3>Streaming changed the underground</h3>
<p>What once stayed in basements now reaches global listeners in hours. That visibility is power — and pressure. Artists must stay authentic while playing for both the room and the algorithm.</p>
<blockquote>"The dance floor is a conversation. If you only talk, you lose the room." — Noctra Music Desk</blockquote>
<p>Next time the bass hits at 2 a.m., listen closer. That frequency is culture in motion.</p>`,
  },
  {
    title: 'Sketch to Stage: Why Live Drawing Is the New Concert Experience',
    slug: 'sketch-to-stage-live-drawing',
    excerpt:
      'Artists are turning concerts and sports nights into live canvases — ink, light, and crowd energy in real time.',
    category: 'Drawing & Art',
    coverFile: 'noctra-cover-drawing.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80',
    featured: true,
    content: `<h2>Drawing as performance</h2>
<p>Live illustration is exploding across festivals and arenas. Artists set up tablets or paper under stage lights and capture motion before it disappears.</p>
<h3>Tools of the trade</h3>
<p>Procreate, clip studios, charcoal, neon markers — the medium matters less than speed and instinct. The goal is not perfection. It is presence.</p>
<h3>Why audiences care</h3>
<p>Fans want something they can take home that is not a phone photo. A signed sketch from the night becomes a memory object — intimate, imperfect, irreplaceable.</p>`,
  },
  {
    title: 'Arena Pulse: The Psychology of a Final-Whistle Crowd',
    slug: 'arena-pulse-final-whistle-crowd',
    excerpt:
      'What happens in the stands when the score is tied and ten seconds remain — sports as pure collective emotion.',
    category: 'Sports',
    coverFile: 'noctra-cover-sports.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
    featured: true,
    content: `<h2>Ten seconds that last forever</h2>
<p>Sports are not only about athletes. They are about the roar that rises when hope and fear share the same breath.</p>
<h3>Sound as strategy</h3>
<p>Home crowds can change free-throw percentages, pass accuracy, and recovery time. Stadium design now treats acoustics like a competitive edge.</p>
<h3>Beyond the scoreboard</h3>
<p>Noctra covers sport as culture: fashion in the stands, ritual chants, and the quiet moments when a season ends.</p>`,
  },
  {
    title: 'Neon Ink: Building a Signature Style as a Digital Illustrator',
    slug: 'neon-ink-digital-illustrator-style',
    excerpt:
      'Colour theory after dark, line weight, and how to make your portfolio unforgettable in a crowded feed.',
    category: 'Drawing & Art',
    coverFile: 'noctra-cover-digital-art.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80',
    featured: false,
    content: `<h2>Style is a decision, not an accident</h2>
<p>Great illustrators repeat intentional choices: limited palettes, bold silhouettes, and a rhythm you can recognize in one second.</p>
<h3>Dark-mode friendly work</h3>
<p>Design for screens that glow at night. High contrast, careful use of neon accents, and negative space keep art readable on phones.</p>
<h3>Portfolio rules</h3>
<p>Show process. Clients hire clarity. A rough → final sequence builds trust faster than ten polished one-offs.</p>`,
  },
  {
    title: 'Playlist Architecture: Crafting the Perfect Pre-Game Warm-Up Mix',
    slug: 'playlist-architecture-pre-game-mix',
    excerpt:
      'BPM, emotional arcs, and how athletes and artists use sound to lock into flow state.',
    category: 'Music',
    coverFile: 'noctra-cover-playlist.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    featured: false,
    content: `<h2>Sound is preparation</h2>
<p>Whether you are stepping on stage or onto a court, the right mix can raise heart rate, focus, and confidence in under twelve minutes.</p>
<h3>The arc</h3>
<p>Start mid-tempo, climb energy, then land one track that feels like a personal anthem. End before the peak — leave hunger for the real performance.</p>`,
  },
  {
    title: 'Court Vision: Skills Drills That Actually Transfer to Game Day',
    slug: 'court-vision-skills-drills-game-day',
    excerpt:
      'Reps that build decision-making under pressure — not just highlight-reel tricks.',
    category: 'Sports',
    coverFile: 'noctra-cover-basketball.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    featured: false,
    content: `<h2>Practice like the scoreboard is watching</h2>
<p>Fancy drills look good on social media. Transfer drills look good when the defense collapses.</p>
<h3>Constraint training</h3>
<p>Limit time, space, or touches. Decision quality improves when comfort is removed on purpose.</p>`,
  },
  {
    title: 'After-Credits Culture: Why Film Nights Are Becoming Social Rituals Again',
    slug: 'after-credits-culture-film-nights',
    excerpt:
      'From midnight screenings to community watch parties — cinema as a shared nightlife event.',
    category: 'Film & TV',
    coverFile: 'noctra-cover-film.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
    featured: false,
    content: `<h2>The screen is a meeting place</h2>
<p>Streaming made everything private. Now friends are reclaiming the dark theatre — not for FOMO, but for presence.</p>
<h3>Noctra’s take</h3>
<p>We cover the films, yes — but also the lobbies, the merch tables, and the conversations that start when the lights come up.</p>`,
  },
  {
    title: 'Esports Arenas: Designing Stages for Virtual Glory',
    slug: 'esports-arenas-virtual-glory',
    excerpt:
      'LED walls, crowd cams, and the showcraft that makes competitive gaming feel like a stadium sport.',
    category: 'Gaming',
    coverFile: 'noctra-cover-gaming.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
    featured: false,
    content: `<h2>Pixels need a stage</h2>
<p>Esports production is entertainment design: lighting cues timed to team fights, hype packages, and casters as narrators of myth.</p>
<h3>What fans remember</h3>
<p>Not only the clutch play — the roar when the camera cuts to a coach’s face. That is sport. That is show.</p>`,
  },
  {
    title: 'Festival Blueprints: Building a Night That Feels Like One Continuous Drop',
    slug: 'festival-blueprints-continuous-drop',
    excerpt:
      'Stage design, crowd flow, and sound systems that turn a field into a living instrument.',
    category: 'Live Events',
    coverFile: 'noctra-cover-festival.jpg',
    coverSource:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    featured: false,
    content: `<h2>A festival is architecture for emotion</h2>
<p>Great nights are planned: sightlines, water points, secondary stages for discovery, and headliners that close the story.</p>
<h3>Safety is part of the show</h3>
<p>The best production teams treat care as invisible design. If you notice it, something already failed.</p>`,
  },
];

const ABOUT_HTML = `<section style="max-width:720px;margin:0 auto;padding:1rem 0;line-height:1.75;color:#e4e4e7">
  <p style="color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px">About Noctra</p>
  <p>Noctra is an entertainment magazine for nights that matter — music that moves, art that sparks, sports that roar, and stages (real or virtual) that stay with you.</p>
  <p>We publish bold stories across <strong>Music</strong>, <strong>Drawing &amp; Art</strong>, <strong>Sports</strong>, <strong>Film &amp; TV</strong>, <strong>Gaming</strong>, and <strong>Live Events</strong>.</p>
  <p style="margin-top:1.5rem;color:#a1a1aa">Powered by CoreHead multi-tenant CMS. Public site: <code>/s/noctra</code>.</p>
</section>`;

const CONTACT_HTML = `<section style="max-width:720px;margin:0 auto;padding:1rem 0;line-height:1.75;color:#e4e4e7">
  <p style="color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px">Contact</p>
  <p><strong>Editorial:</strong> hello@noctra.demo</p>
  <p><strong>Events desk:</strong> stages@noctra.demo</p>
  <p><strong>Studio:</strong> Night desk · Colombo (demo)</p>
  <p style="margin-top:1.5rem;color:#a1a1aa">For evaluation demos — custom page at <code>/s/noctra/p/contact</code>.</p>
</section>`;

const BLOG_ARCHIVE_LAYOUT = {
  blocks: [
    {
      id: 'n-arch-kicker',
      type: 'Paragraph',
      content: 'After dark culture',
      styles: {
        color: '#a78bfa',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.22em',
      },
    },
    {
      id: 'n-arch-title',
      type: 'Heading',
      content: 'Noctra Journal',
      styles: {
        fontSize: 'clamp(2rem, 4vw, 2.85rem)',
        fontWeight: '900',
        color: '#fafafa',
        letterSpacing: '-0.03em',
      },
    },
    {
      id: 'n-arch-sub',
      type: 'Paragraph',
      content:
        'Music, drawing, sports, film, and live energy — stories for nights that refuse to be ordinary.',
      styles: { color: '#a1a1aa', fontSize: '1.05rem', marginBottom: '2rem' },
    },
    { id: 'n-arch-featured', type: 'Featured Carousel', content: {} },
    {
      id: 'n-arch-latest',
      type: 'Heading',
      content: 'Latest drops',
      styles: {
        fontSize: '1.4rem',
        fontWeight: '800',
        color: '#fafafa',
        marginTop: '2rem',
      },
    },
    {
      id: 'n-arch-grid',
      type: 'Collection List',
      content: { limit: 12, category: '' },
    },
    { id: 'n-arch-sp', type: 'Spacer', content: 28 },
    {
      id: 'n-arch-news',
      type: 'Newsletter',
      content: {
        title: 'Get the latest stories',
        description: 'Weekly updates from Noctra — music, art, sport, and live culture.',
        buttonText: 'Subscribe',
      },
    },
  ],
};

const SINGLE_POST_LAYOUT = {
  blocks: [
    {
      id: 'n-cat',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.category' },
      styles: {
        color: '#c4b5fd',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.16em',
      },
    },
    {
      id: 'n-title',
      type: 'Heading',
      content: '',
      bindings: { content: 'post.title' },
      styles: {
        fontSize: 'clamp(1.85rem, 4vw, 2.7rem)',
        fontWeight: '900',
        color: '#fafafa',
        lineHeight: '1.15',
      },
    },
    {
      id: 'n-excerpt',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.excerpt' },
      styles: { color: '#a1a1aa', fontSize: '1.1rem', marginBottom: '1.25rem' },
    },
    {
      id: 'n-cover',
      type: 'Image',
      content: '',
      bindings: { content: 'post.coverImage' },
    },
    {
      id: 'n-body',
      type: 'Paragraph',
      content: '',
      bindings: { content: 'post.contentHtml' },
      styles: { color: '#e4e4e7', lineHeight: '1.85' },
    },
    { id: 'n-div', type: 'Divider', content: '' },
    {
      id: 'n-quote',
      type: 'Quote',
      content: 'Stay loud. Stay curious. Stay after dark. — Noctra',
    },
    {
      id: 'n-cta',
      type: 'Button',
      content: { text: 'Back to journal', url: '/s/noctra/blog' },
    },
  ],
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'CoreHead-Noctra-Seeder/1.0',
          Accept: 'image/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(destPath, () => {});
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(destPath)));
      }
    );
    req.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function upsertSetting(siteId, key, value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  const existing = await prisma.setting.findFirst({ where: { siteId, key } });
  if (existing) {
    return prisma.setting.update({ where: { id: existing.id }, data: { value: raw } });
  }
  return prisma.setting.create({ data: { siteId, key, value: raw } });
}

async function ensureMedia(siteId, { name, type, url, size }) {
  const existing = await prisma.media.findFirst({
    where: { siteId, url, isDeleted: false },
  });
  if (existing) {
    return prisma.media.update({
      where: { id: existing.id },
      data: { name, type, size: String(size) },
    });
  }
  return prisma.media.create({
    data: {
      name,
      type,
      size: String(size),
      url,
      isDeleted: false,
      siteId,
    },
  });
}

async function upsertTemplate({ siteId, authorId, name, type, layoutJson }) {
  const existing = await prisma.templates.findFirst({
    where: { siteId, type, name },
  });
  await prisma.templates.updateMany({
    where: {
      siteId,
      type,
      category: 'global_default',
      ...(existing ? { NOT: { id: existing.id } } : {}),
    },
    data: { category: null },
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
    return prisma.templates.update({ where: { id: existing.id }, data });
  }
  return prisma.templates.create({ data });
}

function ensureLogos() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const pairs = [
    ['noctra-icon.svg', '../../corehead-frontend/frontend/public/demo/noctra-icon.svg'],
    ['noctra-logo-light.svg', '../../corehead-frontend/frontend/public/demo/noctra-logo-light.svg'],
  ];
  for (const [name, rel] of pairs) {
    const dest = path.join(UPLOADS_DIR, name);
    const src = path.join(__dirname, rel);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`📎 Logo → public/uploads/${name}`);
    }
  }
}

async function resolveOwner() {
  const email = process.env.DEMO_OWNER_EMAIL;
  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) return u;
  }
  let user =
    (await prisma.user.findUnique({ where: { email: 'admin@corehead.com' } })) ||
    (await prisma.user.findFirst({ where: { role: 'admin' } })) ||
    (await prisma.user.findFirst());

  if (!user) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Noctra@Demo2026', 10);
    user = await prisma.user.create({
      data: {
        email: 'demo@noctra.demo',
        password: hashed,
        role: 'admin',
        isEmailVerified: true,
        name: 'Rio Vance',
        designation: 'Culture Editor',
        bio: 'Music, sport, and stage culture for Noctra.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RioVance',
      },
    });
    console.log('Created owner: demo@noctra.demo / Noctra@Demo2026');
  }
  return user;
}

async function main() {
  console.log('\n🌙 Seeding Noctra entertainment demo (dark theme)...\n');
  ensureLogos();

  const owner = await resolveOwner();
  console.log(`👤 Owner: ${owner.email} (id=${owner.id})`);

  const logo = '/uploads/noctra-icon.svg';
  let site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });

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
      data: { name: SITE_NAME, logo, status: 'active' },
    });
    console.log(`♻️  Updated site: ${SITE_NAME} id=${site.id}`);
  }

  await prisma.siteMember.upsert({
    where: { siteId_userId: { siteId: site.id, userId: owner.id } },
    create: { siteId: site.id, userId: owner.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  });

  // Website metadata
  await upsertSetting(site.id, 'website_metadata', {
    websiteName: SITE_NAME,
    pageTitle: 'Noctra — Music, Art, Sports & Nightlife Culture',
    description:
      'Noctra is a dark entertainment magazine covering music, drawing & art, sports, film, gaming, and live events. Stay after dark.',
    favicon: '/uploads/noctra-icon.svg',
    ogImage: '/uploads/noctra-cover-music-dj.jpg',
    scripts: [],
  });

  // Dark entertainment branding (Modern Dark + unique violet accents)
  await upsertSetting(site.id, 'active_theme', { themeId: THEME_ID, id: THEME_ID });
  await upsertSetting(site.id, `theme_${THEME_ID}_colours`, {
    primary: '#8b5cf6',
    background: '#09090b',
    foreground: '#fafafa',
    accent: '#ec4899',
    card: '#18181b',
    cardForeground: '#fafafa',
    muted: '#a1a1aa',
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_header`, {
    headerBg: '#000000',
    headerFont: '#fafafa',
    headerLogo: '/uploads/noctra-logo-light.svg',
    ctaText: 'Explore stories',
    ctaUrl: `/s/${SITE_SLUG}/blog`,
    ctaBg: '#8b5cf6',
    ctaColor: '#ffffff',
    navLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_footer`, {
    footerBg: '#000000',
    footerFont: '#a1a1aa',
    footerLogo: '/uploads/noctra-logo-light.svg',
    footerDescription:
      'Noctra — entertainment after dark. Music, drawing, sports, film, gaming, and live stages.',
    copyrightText: '© 2026 Noctra. All rights reserved.',
    quickLinks: [
      { id: 1, name: 'Home', link: `/s/${SITE_SLUG}` },
      { id: 2, name: 'Journal', link: `/s/${SITE_SLUG}/blog` },
      { id: 3, name: 'About', link: `/s/${SITE_SLUG}/p/about` },
      { id: 4, name: 'Contact', link: `/s/${SITE_SLUG}/p/contact` },
    ],
  });
  await upsertSetting(site.id, `theme_${THEME_ID}_font`, { font: 'inter' });
  console.log('✅ Dark theme branding applied');

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
          data: { ...cat, siteId: site.id },
        });
      } catch (e) {
        console.warn(`  category skip: ${cat.name}`);
      }
    }
  }
  console.log(`✅ Categories: ${CATEGORIES.length}`);

  // Download covers + media library + posts
  let postsCreated = 0;
  let postsUpdated = 0;
  for (const post of POSTS) {
    const dest = path.join(UPLOADS_DIR, post.coverFile);
    const url = `/uploads/${post.coverFile}`;
    try {
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
        console.log(`⬇️  ${post.coverFile}`);
        await downloadFile(post.coverSource, dest);
      }
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      await ensureMedia(site.id, {
        name: post.coverFile.replace('noctra-cover-', '').replace('.jpg', ' cover'),
        type: 'image/jpeg',
        url,
        size,
      });
    } catch (err) {
      console.warn(`  cover fail ${post.coverFile}: ${err.message}`);
    }

    const existing = await prisma.post.findFirst({
      where: { siteId: site.id, slug: post.slug },
    });
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImage: url,
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
      postsUpdated++;
    } else {
      await prisma.post.create({ data });
      postsCreated++;
    }
  }
  console.log(`✅ Posts created=${postsCreated} updated=${postsUpdated}`);

  // Brand logos in media library
  for (const f of ['noctra-icon.svg', 'noctra-logo-light.svg']) {
    const fp = path.join(UPLOADS_DIR, f);
    if (!fs.existsSync(fp)) continue;
    await ensureMedia(site.id, {
      name: f,
      type: f.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
      url: `/uploads/${f}`,
      size: fs.statSync(fp).size,
    });
  }

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
    if (existing) await prisma.page.update({ where: { id: existing.id }, data });
    else await prisma.page.create({ data });
  }
  console.log('✅ Pages: About, Contact');

  // Layouts
  await upsertTemplate({
    siteId: site.id,
    authorId: owner.id,
    name: 'Noctra Night Archive',
    type: 'Blog Archive',
    layoutJson: BLOG_ARCHIVE_LAYOUT,
  });
  await upsertTemplate({
    siteId: site.id,
    authorId: owner.id,
    name: 'Noctra Single Drop',
    type: 'Single Post',
    layoutJson: SINGLE_POST_LAYOUT,
  });

  for (const row of [
    { slug: 'blog-archive', name: 'Noctra Night Archive', layout: BLOG_ARCHIVE_LAYOUT },
    { slug: 'single-post', name: 'Noctra Single Drop', layout: SINGLE_POST_LAYOUT },
  ]) {
    const existing = await prisma.pageLayout.findFirst({
      where: { siteId: site.id, slug: row.slug },
    });
    if (existing) {
      await prisma.pageLayout.update({
        where: { id: existing.id },
        data: { name: row.name, layout: row.layout, isActive: true },
      });
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
    }
  }
  console.log('✅ Layouts published');

  console.log(`
🎉 Noctra is live!

  Brand:     ${SITE_NAME} — entertainment after dark
  Theme:     Modern Dark (${THEME_ID}) · violet/pink accents
  Public:    /s/${SITE_SLUG}
  Journal:   /s/${SITE_SLUG}/blog
  About:     /s/${SITE_SLUG}/p/about
  Contact:   /s/${SITE_SLUG}/p/contact

  Categories: Music · Drawing & Art · Sports · Film & TV · Gaming · Live Events
  Posts:      ${POSTS.length} published

  Open http://localhost:3000/s/${SITE_SLUG}
  Admin: switch site → Noctra
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
