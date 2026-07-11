const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RESERVED_PAGE_SLUGS = new Set([
  'blog',
  'admin',
  'api',
  'p',
  'login',
  'signup',
  'media',
  'posts',
  'pages',
]);

const normalizeSlug = (raw) => {
  const slug = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^\//, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug;
};

const assertSlug = (slug) => {
  if (!slug || slug.length < 1 || slug.length > 150) {
    const err = new Error('Slug must be 1–150 characters');
    err.statusCode = 400;
    throw err;
  }
  if (RESERVED_PAGE_SLUGS.has(slug)) {
    const err = new Error(`Slug "${slug}" is reserved`);
    err.statusCode = 400;
    throw err;
  }
};

const isPublished = (status) =>
  String(status || '').toLowerCase() === 'published';

/**
 * R3-1: Create page for current site (requireSite).
 */
exports.createPage = async (req, res) => {
  try {
    const siteId = req.siteId;
    const { name, slug, htmlContent, status } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (htmlContent === undefined || htmlContent === null) {
      return res
        .status(400)
        .json({ success: false, error: 'htmlContent is required' });
    }

    const normalizedSlug = normalizeSlug(slug);
    try {
      assertSlug(normalizedSlug);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ success: false, error: e.message });
    }

    const existing = await prisma.page.findUnique({
      where: {
        siteId_slug: { siteId, slug: normalizedSlug },
      },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: 'Slug already in use on this site' });
    }

    const page = await prisma.page.create({
      data: {
        name: String(name).trim(),
        slug: normalizedSlug,
        htmlContent: String(htmlContent),
        status: status || 'Draft',
        siteId,
      },
    });

    return res.status(201).json({ success: true, page });
  } catch (error) {
    console.error('Create page error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Server error creating page: ' + error.message });
  }
};

/**
 * R3-1: List pages for current site.
 */
exports.getPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      where: { siteId: req.siteId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, pages });
  } catch (error) {
    console.error('Get pages error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Server error fetching pages' });
  }
};

/**
 * R3-1: Get one page (member) by id within site.
 */
exports.getPageById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const page = await prisma.page.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    return res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching page' });
  }
};

/**
 * Public: published page by site + slug (no auth).
 * Query: siteId= or header X-Site-Id
 */
exports.getPublicPageBySlug = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    const rawSiteId =
      req.headers['x-site-id'] || req.query.siteId || req.siteId;
    const siteId = rawSiteId ? parseInt(String(rawSiteId), 10) : null;

    if (!siteId || !Number.isFinite(siteId)) {
      return res.status(400).json({
        success: false,
        error: 'siteId is required (X-Site-Id or ?siteId=)',
      });
    }

    const page = await prisma.page.findFirst({
      where: {
        siteId,
        slug,
        status: { in: ['Published', 'published'] },
      },
    });

    if (!page || !isPublished(page.status)) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    return res.status(200).json({
      success: true,
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        htmlContent: page.htmlContent,
        status: page.status,
        siteId: page.siteId,
        updatedAt: page.updatedAt,
      },
    });
  } catch (error) {
    console.error('Public page error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching page' });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.page.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const { name, slug, htmlContent, status } = req.body || {};
    const data = {};

    if (name !== undefined) data.name = String(name).trim();
    if (htmlContent !== undefined) data.htmlContent = String(htmlContent);
    if (status !== undefined) data.status = status;

    if (slug !== undefined) {
      const normalizedSlug = normalizeSlug(slug);
      try {
        assertSlug(normalizedSlug);
      } catch (e) {
        return res.status(e.statusCode || 400).json({ success: false, error: e.message });
      }
      if (normalizedSlug !== existing.slug) {
        const clash = await prisma.page.findUnique({
          where: {
            siteId_slug: { siteId: req.siteId, slug: normalizedSlug },
          },
        });
        if (clash) {
          return res
            .status(409)
            .json({ success: false, error: 'Slug already in use on this site' });
        }
      }
      data.slug = normalizedSlug;
    }

    const page = await prisma.page.update({
      where: { id },
      data,
    });

    return res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Update page error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Server error updating page' });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.page.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    await prisma.page.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Server error deleting page' });
  }
};
