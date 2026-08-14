const prisma = require('../models/prismaClient');
const { assertSameSite } = require('../middlewares/siteMiddleware');
const { isPlatformAdmin } = require('../utils/siteScope');
const {
  POST_STATUS,
  normalizePostStatus,
  isPublicPost,
  publicPostWhere,
  buildPostStatusFields,
} = require('../contracts/postPublication');

// Helper to format post with author details safely
const formatPostData = (post) => {
  let author = { name: 'Unknown', avatar: 'U' };

  if (post.author) {
    const name = post.author.name || post.author.email?.split('@')[0] || 'Unknown';
    author = {
      id: post.author.id,
      name,
      email: post.author.email,
      avatar: post.author.avatar || name.charAt(0).toUpperCase(),
    };
  }

  const { author: rawAuthor, ...postWithoutAuthor } = post;
  const status = normalizePostStatus(post.status || (post.isPublished ? POST_STATUS.PUBLISHED : POST_STATUS.DRAFT));
  const cover = post.coverImage || null;
  return {
    ...postWithoutAuthor,
    status,
    isPublished: status === POST_STATUS.PUBLISHED,
    author,
    // Aliases used by admin UI + public renderer
    thumbnailUrl: cover,
    featured_image: cover,
    imageUrl: cover,
  };
};

const canManagePost = (post, userId, userRole, siteRole) => {
  const role = String(siteRole || '').toUpperCase();
  const canManageAll =
    isPlatformAdmin(userRole) || role === 'OWNER' || role === 'EDITOR';
  return canManageAll || post.authorId === userId;
};

// Create a new post (requires site context)
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      featured,
      categories,
      category,
      tags,
      thumbnailUrl,
      authorId,
      keywords,
      metaTitle,
      metaDescription,
      canonicalUrl,
      structuredData,
      published_date,
      showToc,
      show_toc,
      allowComments,
      allow_comments,
    } = req.body;

    const allowCommentsFlag =
      allowComments !== undefined ? allowComments : allow_comments;
    // Default ON when omitted
    const allowCommentsValue =
      allowCommentsFlag === undefined || allowCommentsFlag === null
        ? true
        : allowCommentsFlag === true || allowCommentsFlag === 'true';

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required.' });
    }

    if (!req.siteId) {
      return res.status(400).json({ error: 'Site context required (X-Site-Id).' });
    }

    // Use logged-in user's ID, or fall back to provided authorId
    const resolvedAuthorId = req.user?.id || parseInt(authorId, 10);
    if (!resolvedAuthorId) {
      return res.status(400).json({ error: 'Author could not be resolved.' });
    }

    const finalCategory =
      category ||
      (Array.isArray(categories) && categories.length > 0 ? categories[0] : 'General');

    const categoriesStr = Array.isArray(categories)
      ? categories.join(',')
      : typeof categories === 'string'
        ? categories
        : '';

    const keywordsStr = Array.isArray(keywords)
      ? keywords.join(',')
      : typeof keywords === 'string'
        ? keywords
        : '';

    let parsedStructuredData = null;
    if (structuredData) {
      try {
        if (typeof structuredData === 'string') {
          JSON.parse(structuredData);
          parsedStructuredData = structuredData;
        } else {
          parsedStructuredData = JSON.stringify(structuredData);
        }
      } catch (_) {
        parsedStructuredData = String(structuredData);
      }
    }

    // Default new posts to Draft unless explicitly published (T11)
    const statusFields = buildPostStatusFields(status ?? POST_STATUS.DRAFT, {
      publishedDate: published_date,
    });

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        coverImage: thumbnailUrl || null,
        status: statusFields.status,
        isPublished: statusFields.isPublished,
        featured: featured === true || featured === 'true',
        category: finalCategory,
        categories: categoriesStr || null,
        tags: tags || [],
        keywords: keywordsStr || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        canonicalUrl: canonicalUrl || null,
        structuredData: parsedStructuredData,
        showToc: showToc === true || showToc === 'true' || show_toc === true || show_toc === 'true',
        allowComments: allowCommentsValue,
        authorId: resolvedAuthorId,
        siteId: req.siteId,
        publishedAt: statusFields.publishedAt,
      },
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ message: 'Post created successfully', ...formatPostData(post) });
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ error: 'A post with this URL slug already exists on this site.' });
    }
    res.status(500).json({ error: 'Failed to create post.', message: error.message });
  }
};

// Get all posts for the current site
exports.getPosts = async (req, res) => {
  try {
    const { category, limit, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = {
      siteId: req.siteId,
    };

    if (category) where.category = category;
    if (status) where.status = status;
    if (req.query.featured !== undefined) {
      where.featured = req.query.featured === 'true';
    }

    // Non-admins: only their posts within the site (authors)
    // Site OWNER/EDITOR see all site posts; platform admin sees all site posts
    const siteRole = String(req.siteRole || '').toUpperCase();
    const canSeeAllOnSite =
      isPlatformAdmin(userRole) || siteRole === 'OWNER' || siteRole === 'EDITOR';

    if (!canSeeAllOnSite) {
      where.authorId = userId;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
      take: limit ? parseInt(limit, 10) : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPosts = posts.map((post) => formatPostData(post));
    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.', message: error.message });
  }
};

// Get single post by ID (must belong to current site)
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id, 10),
        siteId: req.siteId,
      },
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const siteRole = String(req.siteRole || '').toUpperCase();
    const canSeeAllOnSite =
      isPlatformAdmin(userRole) || siteRole === 'OWNER' || siteRole === 'EDITOR';

    if (!canSeeAllOnSite && post.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied. This post does not belong to you.' });
    }

    res.status(200).json(formatPostData(post));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post.', message: error.message });
  }
};

// Public: get single post by slug — T15: require siteId to avoid cross-tenant slug leaks
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Multi-tenant: site scope is required for public post resolution
    if (!req.siteId) {
      return res.status(400).json({
        error: 'siteId is required (X-Site-Id header or ?siteId=).',
      });
    }

    const where = publicPostWhere(req.siteId, { slug });

    let post = await prisma.post.findFirst({
      where,
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    // Fallback: normalize slug characters
    if (!post && slug) {
      try {
        const decodedSlug = decodeURIComponent(slug);
        const normalizedSlug = decodedSlug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        if (normalizedSlug && normalizedSlug !== slug) {
          post = await prisma.post.findFirst({
            where: publicPostWhere(req.siteId, { slug: normalizedSlug }),
            include: {
              author: { select: { id: true, email: true, name: true, avatar: true } },
            },
          });
        }
      } catch (err) {
        console.error('Error decoding/normalizing slug:', err);
      }
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Public slug endpoint: drafts / unpublished must not be readable (T11/T15)
    if (!isPublicPost(post)) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json(formatPostData(post));
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    res.status(500).json({ error: 'Failed to fetch post.', message: error.message });
  }
};

// Update a post (same site only)
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      thumbnailUrl,
      category,
      categories,
      tags,
      featured,
      published_date,
      showToc,
      show_toc,
      allowComments,
      allow_comments,
      keywords,
      metaTitle,
      metaDescription,
      canonicalUrl,
      structuredData,
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const allowCommentsUpdate =
      allowComments !== undefined ? allowComments : allow_comments;
    const showTocUpdate = showToc !== undefined ? showToc : show_toc;

    const finalCategory =
      category ||
      (Array.isArray(categories) && categories.length > 0 ? categories[0] : undefined);

    const keywordsValue = Array.isArray(keywords)
      ? keywords.join(',')
      : typeof keywords === 'string'
        ? keywords
        : undefined;

    let structuredDataValue;
    if (structuredData !== undefined) {
      structuredDataValue =
        typeof structuredData === 'string'
          ? structuredData
          : JSON.stringify(structuredData);
    }

    const existingPost = await prisma.post.findFirst({
      where: {
        id: parseInt(id, 10),
        siteId: req.siteId,
      },
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });

    if (!canManagePost(existingPost, userId, userRole, req.siteRole)) {
      return res.status(403).json({ error: 'Access denied. You can only update your own posts.' });
    }

    if (!assertSameSite(existingPost.siteId, req.siteId)) {
      return res.status(403).json({ error: 'Access denied. Cross-site update blocked.' });
    }

    // coverImage: prefer short URL (/uploads/...). Base64 data-URLs are allowed
    // after Text migration but still discouraged (huge payloads).
    let coverImage = thumbnailUrl;
    if (coverImage === '') coverImage = null;
    if (
      typeof coverImage === 'string' &&
      coverImage.startsWith('data:') &&
      coverImage.length > 2_000_000
    ) {
      return res.status(400).json({
        error:
          'Cover image is too large. Upload via Media Library so the post stores a short /uploads/... URL.',
      });
    }

    const data = {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(thumbnailUrl !== undefined && { coverImage }),
      ...(finalCategory !== undefined && { category: finalCategory }),
      ...(tags !== undefined && {
        tags: Array.isArray(tags)
          ? tags
          : typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
      }),
      ...(featured !== undefined && { featured: featured === true || featured === 'true' }),
      ...(showTocUpdate !== undefined && {
        showToc: showTocUpdate === true || showTocUpdate === 'true',
      }),
      ...(allowCommentsUpdate !== undefined && {
        allowComments:
          allowCommentsUpdate === true || allowCommentsUpdate === 'true',
      }),
      ...(keywordsValue !== undefined && { keywords: keywordsValue || null }),
      ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
      ...(metaDescription !== undefined && { metaDescription: metaDescription || null }),
      ...(canonicalUrl !== undefined && { canonicalUrl: canonicalUrl || null }),
      ...(structuredDataValue !== undefined && { structuredData: structuredDataValue || null }),
    };

    if (status !== undefined) {
      Object.assign(
        data,
        buildPostStatusFields(status, {
          previousPublishedAt: existingPost.publishedAt,
          publishedDate: published_date,
        })
      );
    } else if (published_date !== undefined) {
      data.publishedAt = new Date(published_date);
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data,
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    res.status(200).json({ message: 'Post updated successfully', post: formatPostData(post) });
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ error: 'A post with this URL slug already exists on this site.' });
    }
    res.status(500).json({ error: 'Failed to update post.', message: error.message });
  }
};

/**
 * T11: Publish post — status Published, visible on public site.
 * PATCH /api/posts/:id/publish
 */
exports.publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingPost = await prisma.post.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });
    if (!canManagePost(existingPost, userId, userRole, req.siteRole)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const statusFields = buildPostStatusFields(POST_STATUS.PUBLISHED, {
      previousPublishedAt: existingPost.publishedAt,
    });

    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: statusFields,
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    res.status(200).json({
      message: 'Post published successfully',
      post: formatPostData(post),
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: 'Failed to publish post.', message: error.message });
  }
};

/**
 * T11: Unpublish post — status Draft (or Unpublished), hidden from public site.
 * PATCH /api/posts/:id/unpublish
 * Body optional: { status: "Draft" | "Unpublished" }
 */
exports.unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const target =
      req.body?.status && String(req.body.status).toLowerCase() === 'unpublished'
        ? POST_STATUS.UNPUBLISHED
        : POST_STATUS.DRAFT;

    const existingPost = await prisma.post.findFirst({
      where: { id: parseInt(id, 10), siteId: req.siteId },
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });
    if (!canManagePost(existingPost, userId, userRole, req.siteRole)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const statusFields = buildPostStatusFields(target, {
      previousPublishedAt: existingPost.publishedAt,
    });

    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: statusFields,
      include: {
        author: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });

    res.status(200).json({
      message: 'Post unpublished successfully',
      post: formatPostData(post),
    });
  } catch (error) {
    console.error('Error unpublishing post:', error);
    res.status(500).json({ error: 'Failed to unpublish post.', message: error.message });
  }
};

// Delete a post (same site only)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingPost = await prisma.post.findFirst({
      where: {
        id: parseInt(id, 10),
        siteId: req.siteId,
      },
    });

    if (!existingPost) return res.status(404).json({ error: 'Post not found.' });

    const siteRole = String(req.siteRole || '').toUpperCase();
    const canManageAll =
      isPlatformAdmin(userRole) || siteRole === 'OWNER' || siteRole === 'EDITOR';

    if (!canManageAll && existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await prisma.post.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.', message: error.message });
  }
};
