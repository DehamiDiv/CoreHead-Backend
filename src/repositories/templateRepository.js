const prisma = require('../models/prismaClient');

const createTemplate = async (data) => {
  return await prisma.templates.create({
    data: {
      authorId: data.authorId,
      name: data.name,
      type: data.type,
      layoutJson: data.layoutJson,
      category: data.category || null,
      status: data.status || 'draft',
      siteId: data.siteId,
      updatedAt: new Date()
    },
  });
};

const getAllTemplates = async (siteId) => {
  return await prisma.templates.findMany({
    where: siteId != null ? { siteId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { email: true } } },
  });
};

const getTemplateById = async (id, siteId = null) => {
  return await prisma.templates.findFirst({
    where: {
      id: parseInt(id, 10),
      ...(siteId != null ? { siteId } : {}),
    },
  });
};

const updateTemplate = async (id, data, newVersion) => {
  const { siteId, authorId, ...safeData } = data;
  return await prisma.templates.update({
    where: { id: parseInt(id, 10) },
    data: {
      ...safeData,
      version: newVersion,
      updatedAt: new Date()
    },
  });
};

const saveTemplateHistory = async (templateId, version, layoutJson, updatedBy) => {
  return await prisma.templateHistory.create({
    data: {
      templateId: parseInt(templateId, 10),
      version,
      layoutJson,
      updatedBy,
    },
  });
};

const deleteTemplate = async (id) => {
  return await prisma.templates.delete({
    where: { id: parseInt(id, 10) },
  });
};

const publishTemplate = async (id, layoutJson, newVersion) => {
  return await prisma.templates.update({
    where: { id: parseInt(id, 10) },
    data: {
      status: 'published',
      ...(layoutJson ? { layoutJson } : {}),
      ...(newVersion != null ? { version: newVersion } : {}),
      updatedAt: new Date(),
    },
  });
};

/**
 * Normalize UI / API type names to a family for matching.
 * Defined before assignTemplate so assign can reuse aliases (R2-5).
 */
const typeAliases = (templateType) => {
  const raw = String(templateType || '').trim();
  const key = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const singleKeys = [
    'single post',
    'single post layout',
    'single',
    'singlepost',
    'post',
    'blog',
    'single_post',
    'single-post',
  ];
  const archiveKeys = [
    'blog archive',
    'archive',
    'blog loop',
    'blog-loop',
    'blog_loop',
    'blog-archive',
    'blog_archive',
    'collection',
    'list',
  ];
  const homeKeys = [
    'home',
    'home page',
    'homepage',
    'home-page',
    'home_page',
  ];

  if (singleKeys.includes(key) || key.includes('single')) {
    return [
      raw,
      'Single Post',
      'single_post',
      'single-post',
      'blog',
      'SinglePost',
    ];
  }
  if (archiveKeys.includes(key) || key.includes('archive') || key.includes('loop')) {
    return [
      raw,
      'Blog Archive',
      'archive',
      'blog-loop',
      'blog_loop',
      'blog-archive',
      'blog_archive',
    ];
  }
  if (homeKeys.includes(key) || key.includes('home page') || key.includes('homepage')) {
    return [
      raw,
      'Home Page',
      'home',
      'homepage',
      'home-page',
      'home_page',
    ];
  }
  return [raw, templateType].filter(Boolean);
};

const assignTemplate = async (id, categoryId, isGlobalDefault, siteId = null) => {
  const templateId = parseInt(id, 10);

  if (isGlobalDefault) {
    const target = await prisma.templates.findUnique({
      where: { id: templateId },
      select: { type: true, siteId: true },
    });
    if (!target) throw new Error('Template not found');

    const types = typeAliases(target.type);
    const scopeSiteId =
      siteId != null ? Number(siteId) : target.siteId != null ? target.siteId : null;

    // Clear previous global defaults of same type family for this site (R2-5)
    await prisma.templates.updateMany({
      where: {
        type: { in: types },
        category: 'global_default',
        ...(scopeSiteId != null ? { siteId: scopeSiteId } : {}),
        NOT: { id: templateId },
      },
      data: { category: null },
    });

    return await prisma.templates.update({
      where: { id: templateId },
      data: {
        category: 'global_default',
        status: 'published', // ensure assign implies published default
      },
    });
  }

  // Category override — store category id/slug as category field
  return await prisma.templates.update({
    where: { id: templateId },
    data: {
      category: categoryId != null ? String(categoryId) : null,
      status: 'published',
    },
  });
};

const resolveActiveLayout = async (
  templateType,
  categoryId,
  siteId = null,
  preferredTemplateId = null
) => {
  const siteFilter = siteId != null ? { siteId: Number(siteId) } : {};
  const types = typeAliases(templateType);
  const published = {
    status: { in: ['published', 'Published'] },
  };

  // 0) Explicit per-post override. It must still be published, match the
  // requested kind family, and belong to the resolved tenant site.
  if (preferredTemplateId != null && siteId != null) {
    const preferredId = Number(preferredTemplateId);
    if (Number.isInteger(preferredId) && preferredId > 0) {
      const preferred = await prisma.templates.findFirst({
        where: {
          id: preferredId,
          type: { in: types },
          ...published,
          ...siteFilter,
        },
      });
      if (preferred) return preferred;
    }
  }
  // 1) category-specific published template
  if (categoryId) {
    const specific = await prisma.templates.findFirst({
      where: {
        type: { in: types },
        category: String(categoryId),
        ...published,
        ...siteFilter,
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (specific) return specific;
  }

  // 2) global_default for this type family + site
  const globalDefault = await prisma.templates.findFirst({
    where: {
      type: { in: types },
      category: 'global_default',
      ...published,
      ...siteFilter,
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (globalDefault) return globalDefault;

  // 3) any published template of this type for the site (R2-1)
  const anyPublished = await prisma.templates.findFirst({
    where: {
      type: { in: types },
      ...published,
      ...siteFilter,
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (anyPublished) return anyPublished;

  // 4) if site scoped and nothing found, do not leak other sites' templates
  return null;
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  saveTemplateHistory,
  publishTemplate,
  assignTemplate,
  resolveActiveLayout,
};
