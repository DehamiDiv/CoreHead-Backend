const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const posts = [
  {
    title: 'The Hidden Wonders of Ancient Rainforests',
    slug: 'hidden-wonders-ancient-rainforests',
    excerpt: 'Deep within the worlds oldest rainforests lie ecosystems untouched by time, where biodiversity thrives in ways science is only beginning to understand.',
    content: 'Deep within the worlds oldest rainforests lie ecosystems untouched by time. Ancient trees tower hundreds of feet overhead, their canopies forming a living cathedral that shelters thousands of species. Scientists have discovered that old-growth trees communicate through underground fungal networks, sharing nutrients and warning signals across vast distances.',
    status: 'published',
    category: 'Environment',
    coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    featured: true,
    authorId: 1,
    publishedAt: new Date(),
    tags: ['nature', 'rainforest', 'environment'],
  },
  {
    title: 'Protecting Coral Reefs in a Warming Ocean',
    slug: 'protecting-coral-reefs-warming-ocean',
    excerpt: 'Coral reefs cover less than 1 percent of the ocean floor yet support over 25 percent of all marine life.',
    content: 'Coral reefs are among the most biodiverse ecosystems on Earth. Rising ocean temperatures cause coral bleaching, threatening these irreplaceable habitats. Marine biologists are developing innovative techniques including coral gardening and assisted evolution to restore damaged reefs.',
    status: 'published',
    category: 'Aquatic Life',
    coverImage: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
    featured: false,
    authorId: 1,
    publishedAt: new Date(),
    tags: ['ocean', 'coral', 'marine'],
  },
  {
    title: 'The Secret Language of Trees',
    slug: 'secret-language-of-trees',
    excerpt: 'Scientists have discovered that trees communicate through underground fungal networks, sharing nutrients and warning signals across entire forests.',
    content: 'Beneath every forest floor lies a vast network of mycorrhizal fungi connecting tree roots in what scientists call the Wood Wide Web. Through these networks, trees share carbon, water, and chemical signals. Mother trees nurture their seedlings and even send nutrients to dying neighbours.',
    status: 'published',
    category: 'Nature Photography',
    coverImage: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80',
    featured: false,
    authorId: 1,
    publishedAt: new Date(),
    tags: ['trees', 'forest', 'science'],
  },
  {
    title: 'Eco-Living: Simple Steps Toward a Sustainable Home',
    slug: 'eco-living-sustainable-home-guide',
    excerpt: 'From composting to solar energy, discover practical ways to reduce your carbon footprint without sacrificing comfort.',
    content: 'Living sustainably does not require drastic lifestyle changes. Small consistent actions such as reducing single-use plastics, choosing renewable energy, and growing a kitchen garden can significantly lower your environmental impact.',
    status: 'published',
    category: 'Eco-Living',
    coverImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    featured: false,
    authorId: 1,
    publishedAt: new Date(),
    tags: ['sustainability', 'home', 'eco'],
  },
  {
    title: 'Migratory Birds: Natures Most Remarkable Journeys',
    slug: 'migratory-birds-remarkable-journeys',
    excerpt: 'Every year billions of birds travel thousands of miles across continents and oceans in one of natures most extraordinary spectacles.',
    content: 'Bird migration is one of the most awe-inspiring phenomena in the natural world. Arctic Terns travel from pole to pole each year covering 70000 kilometres. Bar-tailed Godwits fly non-stop for nine days across the Pacific Ocean.',
    status: 'published',
    category: 'Outdoor Adventures',
    coverImage: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80',
    featured: false,
    authorId: 1,
    publishedAt: new Date(),
    tags: ['birds', 'wildlife', 'migration'],
  }
];

async function main() {
  for (const post of posts) {
    try {
      const created = await prisma.post.create({ data: post });
      console.log(`Created: ${created.title} (id=${created.id})`);
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`Already exists (skip): ${post.title}`);
      } else {
        console.error(`Failed: ${post.title} =>`, err.message);
      }
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
