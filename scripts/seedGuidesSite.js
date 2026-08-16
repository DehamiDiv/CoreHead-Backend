const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GUIDE_POSTS = [
  // === QUICKSTART CATEGORY ===
  {
    title: 'Getting Started with CoreHead',
    slug: 'getting-started-with-corehead',
    excerpt: 'Learn how to set up your first site on CoreHead in under 5 minutes. This guide walks you through account creation, site setup, and publishing your first post.',
    content: `<h2>Welcome to CoreHead</h2>
<p>CoreHead is an intelligent blog builder that lets you create, customize, and publish dynamic blogs using a visual drag-and-drop interface.</p>
<h3>Step 1: Create Your Account</h3>
<p>Head to corehead-frontend-production.up.railway.app and click <strong>Sign Up</strong>. Enter your email and password, then verify your email via OTP.</p>
<h3>Step 2: Create a Site</h3>
<p>After login, go through the onboarding flow to create your first site. Give it a name and a unique slug (e.g. my-blog).</p>
<h3>Step 3: Publish Your First Post</h3>
<p>Navigate to <strong>Posts → Create</strong> and write your first article. Click Publish when ready!</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'quickstart',
    tags: ['getting-started', 'setup', 'beginner'],
  },
  {
    title: 'How to Use the Drag & Drop Builder',
    slug: 'how-to-use-the-drag-drop-builder',
    excerpt: 'Master the CoreHead visual builder. Learn how to add blocks, rearrange layouts, bind CMS data, and publish beautiful page templates.',
    content: `<h2>The Visual Builder</h2>
<p>The CoreHead builder lets you design page templates visually — no code required.</p>
<h3>Adding Blocks</h3>
<p>Drag any block from the left sidebar (Heading, Paragraph, Image, etc.) and drop it on the canvas.</p>
<h3>Styling Blocks</h3>
<p>Click any block to select it, then use the right panel's Style tab to change font size, color, background, and font family.</p>
<h3>CMS Data Binding</h3>
<p>Select a block → click the database icon → bind fields like {post.title} or {post.coverImage} to make your template dynamic.</p>
<h3>Saving & Publishing</h3>
<p>Use the Save button to auto-save, or the Publish button to create a live post from the current layout.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'quickstart',
    tags: ['builder', 'drag-and-drop', 'templates'],
  },
  {
    title: 'Setting Up Your Blog Theme',
    slug: 'setting-up-your-blog-theme',
    excerpt: 'Customize your blog\'s appearance with CoreHead\'s theme settings. Change colors, typography, and layout to match your brand.',
    content: `<h2>Appearance Settings</h2>
<p>Go to <strong>Settings → Appearance</strong> to customize your blog's look and feel.</p>
<h3>Colors</h3>
<p>Choose primary and accent colors that match your brand identity.</p>
<h3>Typography</h3>
<p>Select from dozens of Google Fonts for headings and body text.</p>
<h3>Layout Presets</h3>
<p>Pick from pre-built layout presets or build your own using the visual builder.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'quickstart',
    tags: ['theme', 'appearance', 'design'],
  },
  {
    title: 'Managing Posts and Categories',
    slug: 'managing-posts-and-categories',
    excerpt: 'Organize your blog content with categories and tags. Learn how to create, edit, and delete posts and keep your content structured.',
    content: `<h2>Content Management</h2>
<p>CoreHead gives you full control over your blog's content structure.</p>
<h3>Creating Posts</h3>
<p>Go to <strong>Posts → Create</strong>. Fill in the title, slug, excerpt, and content. Assign a category before publishing.</p>
<h3>Categories</h3>
<p>Navigate to <strong>Categories</strong> in the sidebar. Create hierarchical categories with parent/child relationships.</p>
<h3>Tags</h3>
<p>Add comma-separated tags to posts for better discoverability and filtering.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'quickstart',
    tags: ['posts', 'categories', 'content'],
  },
  {
    title: 'Inviting Team Members',
    slug: 'inviting-team-members',
    excerpt: 'Collaborate with your team on CoreHead. Learn how to invite authors, editors, and admins to your site.',
    content: `<h2>Team Collaboration</h2>
<p>CoreHead supports multi-user teams. You can invite collaborators with specific roles.</p>
<h3>Roles Available</h3>
<ul>
<li><strong>Admin</strong> - Full access to all site settings</li>
<li><strong>Editor</strong> - Can create and manage all posts</li>
<li><strong>Author</strong> - Can create and manage their own posts</li>
</ul>
<h3>Sending Invites</h3>
<p>Go to <strong>Team</strong> in the sidebar → Enter the email address and select a role → Send Invite.</p>
<p>The invitee receives an email with a link to join your site.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'quickstart',
    tags: ['team', 'collaboration', 'roles'],
  },

  // === BUILD CATEGORY ===
  {
    title: 'Building a Blog Archive Page',
    slug: 'building-a-blog-archive-page',
    excerpt: 'Create a stunning blog listing page using the CoreHead builder. Use the Collection List block to dynamically display all your posts.',
    content: `<h2>Blog Archive Template</h2>
<p>A blog archive page lists all your posts dynamically. Use the builder to design it once and it updates automatically.</p>
<h3>Step 1: Create a New Template</h3>
<p>Go to Layouts → New Layout. Set the type to <strong>Blog Archive</strong>.</p>
<h3>Step 2: Add a Collection List Block</h3>
<p>Drag the <strong>Collection List</strong> block to the canvas. This block auto-renders all published posts.</p>
<h3>Step 3: Customize the Card Layout</h3>
<p>Inside the Collection List settings, choose which fields to display: title, excerpt, cover image, date, category.</p>
<h3>Step 4: Save and Assign</h3>
<p>Save the template and assign it to your site's blog archive from Template Assignment settings.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'build',
    tags: ['archive', 'template', 'collection-list'],
  },
  {
    title: 'Creating a Custom Single Post Template',
    slug: 'creating-a-custom-single-post-template',
    excerpt: 'Design a beautiful article page with the builder. Bind dynamic CMS fields like title, content, author, and cover image.',
    content: `<h2>Single Post Template</h2>
<p>The single post template controls how individual blog articles look.</p>
<h3>Start with a Hero Section</h3>
<p>Add a Container block → Inside it, add an Image block bound to <code>{post.coverImage}</code> and a Heading bound to <code>{post.title}</code>.</p>
<h3>Add the Content Area</h3>
<p>Add a Paragraph block and bind it to <code>{post.content}</code>. This will render the full article body.</p>
<h3>Author Info</h3>
<p>Add another Container → bind it to author fields like <code>{post.author.name}</code> and <code>{post.author.avatar}</code>.</p>
<h3>Save & Assign</h3>
<p>Save the template → go to Template Assignment → assign it as the Single Post template.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'build',
    tags: ['single-post', 'template', 'cms-binding'],
  },
  {
    title: 'Using the Media Library',
    slug: 'using-the-media-library',
    excerpt: 'Upload, manage, and reuse images across your site with the CoreHead Media Library.',
    content: `<h2>Media Library</h2>
<p>The Media Library is a central repository for all images and files used on your site.</p>
<h3>Uploading Images</h3>
<p>Navigate to <strong>Media</strong> in the sidebar → click Upload → select files from your computer.</p>
<h3>Using Images in Posts</h3>
<p>When editing a post, click the image field → select from Media Library to insert an uploaded image.</p>
<h3>Using Images in Builder</h3>
<p>Add an Image block to the canvas → click "Upload from Device" or enter a URL in the Image URL field.</p>
<h3>Deleting Images</h3>
<p>Hover over any image in the library → click the trash icon to permanently delete it.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'build',
    tags: ['media', 'images', 'uploads'],
  },
  {
    title: 'Setting Up a Custom Domain',
    slug: 'setting-up-a-custom-domain',
    excerpt: 'Connect your own domain name to your CoreHead site. Step-by-step DNS configuration guide.',
    content: `<h2>Custom Domain Setup</h2>
<p>Give your blog a professional URL by connecting a custom domain.</p>
<h3>Step 1: Purchase a Domain</h3>
<p>Buy a domain from any registrar (Namecheap, GoDaddy, Cloudflare, etc.)</p>
<h3>Step 2: Add Domain in CoreHead</h3>
<p>Go to <strong>Settings → Domain</strong> → Enter your domain name → Click Add Domain.</p>
<h3>Step 3: Configure DNS</h3>
<p>Add a CNAME record pointing to your CoreHead deployment URL in your domain registrar's DNS settings.</p>
<h3>Step 4: Verify</h3>
<p>Wait up to 48 hours for DNS propagation. CoreHead will automatically detect when your domain is live.</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'build',
    tags: ['domain', 'dns', 'deployment'],
  },
  {
    title: 'Enabling Comments on Your Blog',
    slug: 'enabling-comments-on-your-blog',
    excerpt: 'Allow readers to engage with your content by enabling the comments system on your CoreHead blog posts.',
    content: `<h2>Comments System</h2>
<p>CoreHead has a built-in commenting system that lets readers engage directly on your posts.</p>
<h3>Enabling Comments</h3>
<p>Go to <strong>Settings → Website</strong> → toggle <strong>Enable Comments</strong> on.</p>
<h3>Moderating Comments</h3>
<p>Navigate to <strong>Comments</strong> in the sidebar. You can approve, reject, or delete any comment.</p>
<h3>Comment Notifications</h3>
<p>When a new comment is posted, you'll receive an email notification at your admin email address.</p>
<h3>Anti-Spam</h3>
<p>CoreHead includes rate limiting on comment submissions to prevent spam (max 30 comments per 15 minutes per IP).</p>`,
    isPublished: true, publishedAt: new Date(), status: "published",
    category: 'build',
    tags: ['comments', 'engagement', 'moderation'],
  },
];

async function main() {
  console.log('Seeding Guides site with posts...');

  const adminEmail = 'admin@corehead.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Admin@CoreHead2026', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        role: 'admin',
        name: 'CoreHead Admin',
        isEmailVerified: true,
        status: 'active',
      },
    });
    console.log('Created admin user');
  }

  // Ensure guides site exists
  let site = await prisma.site.findUnique({ where: { slug: 'guides' } });
  if (!site) {
    site = await prisma.site.create({
      data: {
        name: 'CoreHead Guides',
        slug: 'guides',
        ownerId: admin.id,
        status: 'active',
        plan: 'premium',
        planStatus: 'active',
      },
    });
    console.log('Created guides site');
  } else {
    // Ensure admin owns it
    site = await prisma.site.update({
      where: { slug: 'guides' },
      data: { ownerId: admin.id }
    });
    console.log('Guides site already exists');
  }

  // Seed or update each guide post
  for (const guide of GUIDE_POSTS) {
    const existing = await prisma.post.findFirst({
      where: { slug: guide.slug, siteId: site.id }
    });

    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: guide.title,
          excerpt: guide.excerpt,
          content: guide.content,
          isPublished: true, publishedAt: new Date(), status: "published",
          category: guide.category,
          tags: guide.tags,
        }
      });
      console.log(`Updated: ${guide.title}`);
    } else {
      await prisma.post.create({
        data: {
          title: guide.title,
          slug: guide.slug,
          excerpt: guide.excerpt,
          content: guide.content,
          isPublished: true, publishedAt: new Date(), status: "published",
          authorId: admin.id,
          siteId: site.id,
          category: guide.category,
          tags: guide.tags,
        }
      });
      console.log(`Created: ${guide.title}`);
    }
  }

  console.log('\nDone! Total guides seeded:', GUIDE_POSTS.length);
  console.log('Quickstart:', GUIDE_POSTS.filter(g => g.category === 'quickstart').length);
  console.log('Build:', GUIDE_POSTS.filter(g => g.category === 'build').length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

