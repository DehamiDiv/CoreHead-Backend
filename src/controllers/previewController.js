const prisma = require('../models/prismaClient');

const getPreviewPosts = async (req, res) => {
    try {
        // We will fetch real posts from the database.
        // As a fallback (if no posts exist yet), we can return mock data 
        // to ensure the frontend still renders something for the Preview

        const limit = parseInt(req.query.limit) || 3;

        let posts = await prisma.post.findMany({
            where: { status: 'published' },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true,
                category: true,
                createdAt: true,
                author: { select: { email: true, name: true } }
            }
        });

        // Map coverImage → thumbnailUrl for frontend compatibility
        const mapped = posts.map(p => ({
            ...p,
            thumbnailUrl: p.coverImage || null,
        }));

        // If no posts are in the database yet, send dummy mock posts
        if (mapped.length === 0) {
            const mocks = Array.from({ length: limit }).map((_, index) => ({
                id: `mock-${index + 1}`,
                title: `Sample Blog Post Title ${index + 1}`,
                slug: `sample-blog-post-${index + 1}`,
                excerpt: "This is a placeholder excerpt for the preview blog post card.",
                thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
                category: "Nature",
                createdAt: new Date().toISOString(),
                author: { email: "admin@corehead.com", name: "Admin" }
            }));
            return res.status(200).json({ posts: mocks });
        }

        res.status(200).json({ posts: mapped });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPreviewPosts
};
