const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLE_POSTS = [
  {
    title: "Beginner's Guide to Planting a Vegetable Garden from Scratch",
    slug: "beginners-guide-vegetable-garden",
    excerpt: "Learn how to start your first vegetable garden with this complete beginner-friendly guide covering soil prep, plant selection, and ongoing care.",
    category: "Plants & Gardens",
    coverImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    content: `<h2>Getting Started with Your Vegetable Garden</h2>
<p>Starting a vegetable garden is one of the most rewarding experiences you can have. Whether you have a sprawling backyard or just a small balcony, growing your own food connects you to nature and provides fresh, healthy produce for your family.</p>
<h3>Choosing the Right Location</h3>
<p>Most vegetables need at least 6-8 hours of direct sunlight per day. Choose a spot that gets morning sun and is protected from harsh afternoon winds. Good drainage is essential — avoid low-lying areas where water tends to pool.</p>
<h3>Preparing Your Soil</h3>
<p>Healthy soil is the foundation of a productive garden. Start by testing your soil's pH level (most vegetables prefer 6.0-7.0). Add compost or well-rotted manure to improve soil structure, drainage, and nutrient content.</p>
<h3>Best Vegetables for Beginners</h3>
<p>Start with easy-to-grow varieties like tomatoes, lettuce, radishes, green beans, and herbs like basil and mint. These are forgiving plants that produce well even with minimal experience.</p>
<blockquote>"The glory of gardening: hands in the dirt, head in the sun, heart with nature." — Alfred Austin</blockquote>
<p>Remember, every expert gardener was once a beginner. Start small, learn from your mistakes, and enjoy the journey of growing your own food.</p>`,
    featured: true,
  },
  {
    title: "Solar Energy for Your Home: A Beginner's Guide to Going Green",
    slug: "solar-energy-home-guide",
    excerpt: "Learn how to harness solar power for your home, reduce energy costs, and contribute to a sustainable future with renewable energy solutions.",
    category: "Eco Living",
    coverImage: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80",
    content: `<h2>Why Solar Energy Matters</h2>
<p>Solar energy is no longer a futuristic concept — it's a practical, affordable solution for homeowners looking to reduce their carbon footprint and energy bills. With advances in technology, solar panels are more efficient and accessible than ever.</p>
<h3>How Solar Panels Work</h3>
<p>Solar panels convert sunlight into electricity using photovoltaic (PV) cells. When sunlight hits these cells, it creates an electric field that generates direct current (DC) electricity, which is then converted to alternating current (AC) for your home.</p>
<h3>Cost and Savings</h3>
<p>While the initial investment can seem significant, most homeowners see a return on investment within 5-8 years. Government incentives, tax credits, and net metering programs can significantly reduce costs.</p>
<p>The average household can save between $10,000 to $30,000 over the lifetime of a solar panel system, while also increasing property value by 3-4%.</p>`,
    featured: false,
  },
  {
    title: "Organic Gardening 101: Growing Your Own Vegetables at Home",
    slug: "organic-gardening-101",
    excerpt: "Start your organic gardening journey with this complete guide to growing fresh, healthy vegetables without synthetic chemicals or pesticides.",
    category: "Plants & Gardens",
    coverImage: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80",
    content: `<h2>What is Organic Gardening?</h2>
<p>Organic gardening is the practice of growing plants without the use of synthetic fertilizers, pesticides, or genetically modified organisms. Instead, it relies on natural processes, companion planting, and biological pest control to create a healthy, sustainable garden ecosystem.</p>
<h3>Building Healthy Soil Naturally</h3>
<p>The cornerstone of organic gardening is healthy, living soil. Use compost, leaf mulch, cover crops, and natural amendments like bone meal and kelp to feed your soil. Healthy soil produces healthy plants that are naturally more resistant to pests and diseases.</p>
<h3>Natural Pest Control</h3>
<p>Encourage beneficial insects like ladybugs, lacewings, and praying mantises. Plant marigolds to deter aphids, and use neem oil as a natural pesticide when needed.</p>`,
    featured: false,
  },
  {
    title: "Protecting Endangered Species: Conservation Efforts That Are Making a Difference",
    slug: "protecting-endangered-species",
    excerpt: "Discover inspiring conservation success stories and learn how global efforts are saving endangered species from the brink of extinction.",
    category: "Wildlife",
    coverImage: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&q=80",
    content: `<h2>The State of Wildlife Conservation</h2>
<p>Around the world, dedicated conservationists, scientists, and communities are working tirelessly to protect endangered species. From the snow leopards of the Himalayas to the sea turtles of the Pacific, these efforts are making a real difference.</p>
<h3>Success Stories</h3>
<p>The giant panda, once on the brink of extinction, has been downlisted from "Endangered" to "Vulnerable" thanks to decades of conservation work in China. Similarly, the bald eagle population in North America has recovered dramatically since the ban of DDT.</p>
<h3>What You Can Do</h3>
<p>Support wildlife conservation organizations, reduce your use of single-use plastics, choose sustainable products, and educate others about the importance of biodiversity. Every action, no matter how small, contributes to the larger effort.</p>
<blockquote>"In the end, we will conserve only what we love; we will love only what we understand; and we will understand only what we are taught." — Baba Dioum</blockquote>`,
    featured: true,
  },
  {
    title: "How to Photograph Wildlife in Their Natural Habitat",
    slug: "wildlife-photography-guide",
    excerpt: "Learn essential wildlife photography techniques including equipment selection, camera settings, understanding animal behavior, and ethical practices.",
    category: "Nature Photography",
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    content: `<h2>The Art of Wildlife Photography</h2>
<p>Wildlife photography is one of the most challenging and rewarding genres of photography. It requires patience, technical skill, and a deep understanding of animal behavior to capture those magical moments in nature.</p>
<h3>Essential Equipment</h3>
<p>A telephoto lens (200-600mm) is essential for wildlife photography. Pair it with a sturdy tripod or monopod for stability. Consider a camera with fast autofocus and high burst rates for capturing animals in motion.</p>
<h3>Understanding Animal Behavior</h3>
<p>The best wildlife photographers are naturalists first and photographers second. Study the habits, routines, and body language of your subjects. Know when they're active, what they eat, and where they rest.</p>
<h3>Ethical Guidelines</h3>
<p>Never disturb wildlife for a photo. Maintain safe distances, don't bait animals, and be mindful of nesting sites and sensitive habitats. The welfare of the animal should always come first.</p>`,
    featured: false,
  },
  {
    title: "Climate Change and Its Impact on Global Ecosystems",
    slug: "climate-change-impact-ecosystems",
    excerpt: "Explore the profound effects of climate change on ecosystems worldwide, from coral reefs to rainforests, and learn what we can do to mitigate its impact.",
    category: "Environment",
    coverImage: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&q=80",
    content: `<h2>A Changing Planet</h2>
<p>Climate change is the defining challenge of our time. Rising temperatures, shifting weather patterns, and increasing extreme events are reshaping ecosystems across the globe at an unprecedented rate.</p>
<h3>Impact on Coral Reefs</h3>
<p>Coral reefs, often called the "rainforests of the sea," are among the most vulnerable ecosystems. Rising ocean temperatures cause coral bleaching, while ocean acidification weakens their calcium carbonate structures. We've already lost over 50% of the world's coral cover.</p>
<h3>Forests Under Threat</h3>
<p>Increased temperatures and changing rainfall patterns are altering forest ecosystems. More frequent and intense wildfires, pest outbreaks, and droughts are threatening forests that serve as critical carbon sinks.</p>
<h3>Taking Action</h3>
<p>Reducing greenhouse gas emissions, supporting renewable energy, protecting natural carbon sinks, and adapting our practices are all essential steps in addressing climate change. The time to act is now.</p>`,
    featured: true,
  },
  {
    title: "Exploring the World's Most Breathtaking Hiking Trails",
    slug: "breathtaking-hiking-trails",
    excerpt: "From the Inca Trail to the Tour du Mont Blanc, discover the world's most spectacular hiking routes that every outdoor enthusiast should experience.",
    category: "Outdoor Adventures",
    coverImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    content: `<h2>Trails That Will Take Your Breath Away</h2>
<p>There's something magical about setting out on foot into the wilderness. These trails offer more than just exercise — they provide a deep connection with nature and experiences that will stay with you forever.</p>
<h3>1. Inca Trail, Peru</h3>
<p>This iconic 4-day trek leads through cloud forests, alpine tundra, and ancient Inca ruins, culminating at the Sun Gate with a stunning sunrise view of Machu Picchu.</p>
<h3>2. Tour du Mont Blanc, Europe</h3>
<p>Circling Western Europe's highest peak through France, Italy, and Switzerland, this 170km trail offers breathtaking Alpine scenery, charming mountain villages, and world-class cuisine.</p>
<h3>3. Milford Track, New Zealand</h3>
<p>Known as "the finest walk in the world," this trail winds through pristine rainforests, past thundering waterfalls, and over mountain passes in Fiordland National Park.</p>
<h3>Preparation Tips</h3>
<p>Train well in advance, invest in quality boots and gear, understand the weather conditions, and always let someone know your plans. The wilderness demands respect and preparation.</p>`,
    featured: false,
  },
  {
    title: "The Healing Power of Aquatic Plants in Home Aquariums",
    slug: "aquatic-plants-home-aquariums",
    excerpt: "Discover how aquatic plants transform your aquarium into a thriving ecosystem while providing natural filtration and stress-reducing beauty.",
    category: "Aquatic Plants",
    coverImage: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80",
    content: `<h2>Why Aquatic Plants Matter</h2>
<p>Aquatic plants are far more than decorative additions to your aquarium. They play a crucial role in maintaining water quality, providing oxygen, and creating a natural habitat that reduces stress for both fish and their owners.</p>
<h3>Top Beginner-Friendly Aquatic Plants</h3>
<p>Java Fern, Anubias, Amazon Sword, and Java Moss are excellent choices for beginners. These hardy plants thrive in a wide range of conditions and require minimal maintenance.</p>
<h3>Setting Up a Planted Tank</h3>
<p>Use a nutrient-rich substrate, provide adequate lighting (8-10 hours daily), and consider adding CO2 supplementation for faster growth. Start with easy plants and gradually add more demanding species as you gain experience.</p>
<h3>Benefits Beyond Beauty</h3>
<p>Studies show that watching aquariums with live plants reduces blood pressure, heart rate, and anxiety. A well-planted aquarium brings a piece of nature into your home, promoting mindfulness and relaxation.</p>`,
    featured: false,
  },
];

async function seedPosts() {
  console.log('🌱 Starting to seed sample posts...\n');

  // Find the first user to assign as author
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found. Please create a user first.');
    process.exit(1);
  }
  console.log(`👤 Using author: ${user.email} (ID: ${user.id})\n`);

  let created = 0;
  let skipped = 0;

  for (const post of SAMPLE_POSTS) {
    // Check if post with this slug already exists
    const existing = await prisma.post.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${post.title}`);
      skipped++;
      continue;
    }

    await prisma.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        coverImage: post.coverImage,
        status: 'published',
        featured: post.featured,
        tags: [],
        author: { connect: { id: user.id } },
        publishedAt: new Date(),
      }
    });

    console.log(`✅ Created: ${post.title} [${post.category}]`);
    created++;
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  console.log('📝 Posts are now available in the Theme 1 preview and public blog!');
  await prisma.$disconnect();
}

seedPosts().catch((e) => {
  console.error('Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
