const prisma = require('../models/prismaClient');

const getPreviewPosts = async (req, res) => {
    try {
        // We will fetch real posts from the database.
        // As a fallback (if no posts exist yet), we can return mock data 
        // to ensure the frontend still renders something for the Preview

        const limit = parseInt(req.query.limit) || 3;

        let posts = await prisma.post.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                imageUrl: true,
                createdAt: true,
                author: { select: { email: true } }
            }
        });

        // If no posts are in the database yet, send dummy mock posts
        if (posts.length === 0) {
            posts = Array.from({ length: limit }).map((_, index) => ({
                id: `mock-${index + 1}`,
                title: `Sample Blog Post Title ${index + 1}`,
                slug: `sample-blog-post-${index + 1}`,
                excerpt: "This is a placeholder excerpt for the preview blog post card.",
                imageUrl: "https://via.placeholder.com/400x250",
                createdAt: new Date().toISOString(),
                author: { email: "admin@corehead.com" }
            }));
        }

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPreviewPosts
};
