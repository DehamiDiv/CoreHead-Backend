const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SITE_NAME = 'CoreHead Guides';
const SITE_SLUG = 'guides';

const CATEGORIES = [
  { name: 'Quickstart', slug: 'quickstart', description: 'Getting started guides for CoreHead' },
  { name: 'Build', slug: 'build', description: 'Advanced building guides and integration tutorials' },
];

const POSTS = [
  {
    title: 'Project Initialization & Setup',
    slug: 'project-initialization-setup',
    excerpt: 'Learn how to configure your environment variables and get the CoreHead backend running with PostgreSQL in minutes.',
    category: 'Quickstart',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    tags: ['Setup', 'Node.js', 'Prisma'],
    featured: true,
    content: `<h2>Introduction to CoreHead Setup</h2>
<p>Welcome to CoreHead! Setting up the platform is simple and straightforward. Follow this step-by-step guide to get your local development environment up and running in minutes.</p>
<h3>1. Clone and Configure Environment</h3>
<p>First, create a <code>.env</code> file in the backend root directory and configure your PostgreSQL database connection URL along with other essential environment keys:</p>
<pre><code>DATABASE_URL="postgresql://postgres:password@localhost:5432/corehead_db?schema=public"
JWT_SECRET="corehead_secret_key_123"
PORT=5000
FRONTEND_URL="http://localhost:3000"</code></pre>
<h3>2. Install Project Dependencies</h3>
<p>Open your terminal and install all required node modules for both the backend and frontend projects:</p>
<pre><code># Install backend dependencies
cd Corehead-Backend
npm install

# Install frontend dependencies
cd ../Corehead/frontend
npm install</code></pre>
<h3>3. Run Database Migrations</h3>
<p>With PostgreSQL running locally, run the Prisma migration command to set up the database tables and schema structures automatically:</p>
<pre><code>npx prisma migrate dev --name init</code></pre>
<h3>4. Seed Initial CoreHead Templates</h3>
<p>CoreHead requires some initial templates, roles, and themes to work correctly. Run the following seed commands in the backend folder:</p>
<pre><code>node scripts/seedAdmin.js
node scripts/seedAppearanceThemes.js</code></pre>
<p>Now, spin up the development servers with <code>npm run dev</code> in both workspace roots. Your CoreHead instance is now fully operational!</p>`
  },
  {
    title: 'Mastering the AI Layout Builder',
    slug: 'mastering-ai-layout-builder',
    excerpt: 'A complete guide on using generative AI to create dynamic blog layouts and landing pages with zero coding required.',
    category: 'Quickstart',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    tags: ['AI Builder', 'Design', 'Automation'],
    featured: true,
    content: `<h2>How CoreHead AI Builder Works</h2>
<p>CoreHead comes equipped with a cutting-edge, state-of-the-art AI-powered layout generator. This allows users to build whole website interfaces, single pages, and blog layouts using natural language commands.</p>
<h3>1. Generating layouts from prompt</h3>
<p>Navigate to the <b>Visual Builder</b> in the admin dashboard and click on <b>Generate with AI</b>. Enter a detailed prompt of the look and feel you want to achieve.</p>
<h3>2. Formulating high-converting prompts</h3>
<p>To get the best layout results from the AI, be specific about visual hierarchy, columns, elements, and styles. For instance:</p>
<blockquote>"A modern dark-themed landing page with a central hero headline, three feature cards, a visual grid showing latest blogs, and a bottom newsletter call-to-action block."</blockquote>
<h3>3. Customizing the generated layout</h3>
<p>Once the AI completes the layout generation, you can click on individual blocks to modify styles (like background colors), edit texts, set category limits, or connect them to dynamic CMS data.</p>`
  },
  {
    title: 'Secure Auth with JWT & OTP',
    slug: 'secure-auth-jwt-otp',
    excerpt: 'Understanding the multi-layer security flow: From bcrypt password hashing to secure OTP email verification.',
    category: 'Quickstart',
    coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    tags: ['Security', 'JWT', 'Auth'],
    featured: true,
    content: `<h2>Multi-Layered Security Flow in CoreHead</h2>
<p>Ensuring absolute protection for content, users, and admin endpoints is paramount. CoreHead implements a robust, multi-layer security architecture out-of-the-box.</p>
<h3>1. Encryption with bcrypt</h3>
<p>When user accounts are created, passwords are salted and hashed using bcrypt. No raw passwords ever hit the database logs or schema.</p>
<h3>2. OTP Verification</h3>
<p>To protect sensitive actions (like email verification or resetting credentials), CoreHead sends a cryptographically random 6-digit OTP (One-Time Password) to the user's verified email address via SMTP.</p>
<h3>3. Session Authorization via JWT</h3>
<p>Upon successful authentication, the server generates a JSON Web Token (JWT) containing token expiry and authorization claims. The client stores this token and passes it in the <code>Authorization: Bearer &lt;token&gt;</code> header on all subsequent API requests. Middlewares handle decoding and populating current session metadata.</p>`
  },
  {
    title: 'Prisma Schema & Migrations',
    slug: 'prisma-schema-migrations',
    excerpt: 'Step-by-step tutorial on extending content models, defining relationships, and running database migrations safely.',
    category: 'Build',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    tags: ['Prisma', 'PostgreSQL', 'Backend'],
    featured: false,
    content: `<h2>Safe Database Operations with Prisma ORM</h2>
<p>CoreHead utilizes Prisma ORM to keep database schemas clean, versioned, and easily queried. Adding fields or modifying relationships is completely safe when adhering to migration best practices.</p>
<h3>1. Modeling with schema.prisma</h3>
<p>Open the file <code>prisma/schema.prisma</code>. Models represent your PostgreSQL tables. Relationships are declared using Prisma's relational schema syntax.</p>
<h3>2. Adding a custom field to content models</h3>
<p>To extend a model (like adding a <code>readingTime</code> column to the <code>Post</code> model), define it in the model block:</p>
<pre><code>model Post {
  id           Int      @id @default(autoincrement())
  title        String
  // Add your new field here
  readingTime  Int?     @default(5)
  ...
}</code></pre>
<h3>3. Generating database migrations</h3>
<p>To update the PostgreSQL tables with the new columns while preserving your data, run the Prisma migration tool in terminal:</p>
<pre><code>npx prisma migrate dev --name add-reading-time-to-posts</code></pre>
<p>This generates the SQL file inside <code>prisma/migrations/</code> and executes it against the local database instance automatically.</p>`
  },
  {
    title: 'RESTful API Integration',
    slug: 'restful-api-integration',
    excerpt: "How to consume CoreHead's headless API endpoints in your React components or third-party mobile applications.",
    category: 'Build',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    tags: ['API', 'Integration', 'Webhooks'],
    featured: false,
    content: `<h2>Consuming Headless CoreHead Endpoints</h2>
<p>CoreHead is designed to be fully headless. This means your public websites, mobile apps, or static frontends can fetch published blog posts, categories, and settings using clean HTTP endpoints.</p>
<h3>1. Fetching Site-Scoped Posts</h3>
<p>To fetch published articles for a specific tenant site, hit the public preview posts endpoint. Make sure to specify the site's unique identifier using the <code>X-Site-Id</code> header or <code>siteId</code> query parameter:</p>
<pre><code>fetch('http://localhost:5000/api/preview/posts?siteId=1&limit=5')
  .then(response => response.json())
  .then(data => console.log('Posts fetched:', data.posts))
  .catch(error => console.error('Error fetching:', error));</code></pre>
<h3>2. Resolving a Single Post by Slug</h3>
<p>To render a complete article page, fetch the single post details by slug name:</p>
<pre><code>fetch('http://localhost:5000/api/posts/slug/project-initialization-setup?siteId=1')
  .then(response => response.json())
  .then(post => console.log('Post details:', post));</code></pre>`
  },
  {
    title: 'Optimizing for Next.js 14',
    slug: 'optimizing-nextjs-14',
    excerpt: 'Leveraging Server Components and Incremental Static Regeneration (ISR) for maximum SEO and performance.',
    category: 'Build',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    tags: ['Next.js', 'SEO', 'Speed'],
    featured: false,
    content: `<h2>Fast Loading with React Server Components (RSC)</h2>
<p>CoreHead leverages the modern Next.js 14 App Router layout to deliver high performance, optimized bundle sizes, and optimal Search Engine Optimization (SEO).</p>
<h3>1. Fetching on the Server</h3>
<p>By default, public site routes (such as <code>/s/[siteSlug]</code>) are React Server Components. They do not run client-side JavaScript for fetching, resulting in instantaneous initial page load times and easy crawling for search engines.</p>
<h3>2. Caching and Revalidation</h3>
<p>Use standard fetch options to define cache and revalidation settings to make sure your pages stay static and fast, yet up-to-date:</p>
<pre><code>const res = await fetch('http://localhost:5000/api/...', {
  next: { revalidate: 60 } // Revalidate cache every 60 seconds
});</code></pre>`
  },
];

async function main() {
  console.log('\n📚 Seeding CoreHead Technical Guides Site...\n');

  // Find administrative user
  let owner =
    (await prisma.user.findFirst({ where: { role: 'admin' } })) ||
    (await prisma.user.findFirst());
  if (!owner) {
    console.error('❌ Error: No user found in database. Run seedAdmin.js first.');
    process.exit(1);
  }

  // Upsert the Site
  let site = await prisma.site.findUnique({ where: { slug: SITE_SLUG } });
  if (!site) {
    site = await prisma.site.create({
      data: {
        name: SITE_NAME,
        slug: SITE_SLUG,
        ownerId: owner.id,
        status: 'active',
        logo: '/logo.png',
        plan: 'premium',
        planStatus: 'active',
      },
    });
    console.log(`✅ Created CoreHead Guides site (ID: ${site.id})`);
  } else {
    site = await prisma.site.update({
      where: { id: site.id },
      data: {
        name: SITE_NAME,
        status: 'active',
        logo: '/logo.png',
      },
    });
    console.log(`ℹ️ Guides site already exists (ID: ${site.id}), updated status and logo.`);
  }

  // Clear existing guides posts and categories to ensure fresh seed
  await prisma.post.deleteMany({ where: { siteId: site.id } });
  await prisma.categories.deleteMany({ where: { siteId: site.id } });
  console.log('🧹 Cleaned up old posts & categories for guides site.');

  // Create Categories
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const createdCat = await prisma.categories.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        siteId: site.id,
      },
    });
    categoryMap[cat.name] = createdCat.name;
    console.log(`📁 Created Category: ${createdCat.name}`);
  }

  // Create Posts
  for (const post of POSTS) {
    const createdPost = await prisma.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: categoryMap[post.category] || post.category,
        coverImage: post.coverImage,
        tags: post.tags,
        isPublished: true,
        status: 'Published',
        featured: post.featured,
        authorId: owner.id,
        siteId: site.id,
        publishedAt: new Date(),
      },
    });
    console.log(`📄 Created Post: "${createdPost.title}" under Category: ${createdPost.category}`);
  }

  console.log('\n🎉 CoreHead Guides Seeding Completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
