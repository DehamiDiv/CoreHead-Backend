const templateRepo = require('../repositories/templateRepository');
const { validateLayoutJson } = require('../utils/layoutValidator');
const { isPlatformAdmin } = require('../utils/siteScope');

const assertSiteTemplateAccess = (template, siteId, userId, userRole) => {
  if (!template) {
    throw Object.assign(new Error('Template not found'), { statusCode: 404 });
  }
  if (siteId != null && template.siteId != null && Number(template.siteId) !== Number(siteId)) {
    throw Object.assign(new Error('Access denied. Template belongs to another site.'), {
      statusCode: 403,
    });
  }
  if (!isPlatformAdmin(userRole) && template.authorId !== userId) {
    // Site owners/editors can still manage via site role in controller layer if needed;
    // keep author check for non-admins as before, unless template is on their site.
    if (siteId == null || Number(template.siteId) !== Number(siteId)) {
      throw Object.assign(
        new Error('Access denied. This template does not belong to you.'),
        { statusCode: 403 }
      );
    }
  }
};

const createTemplate = async (authorId, templateData, siteId) => {
  const { name, type, layoutJson, category, status } = templateData;

  if (!name || !type || !layoutJson) {
    throw new Error('Missing required template fields (name, type, layoutJson)');
  }
  if (!siteId) {
    throw new Error('Site context required (X-Site-Id)');
  }

  validateLayoutJson(layoutJson);

  return await templateRepo.createTemplate({
    name,
    type,
    layoutJson,
    category,
    status: status || 'draft',
    authorId,
    siteId,
  });
};

const getTemplates = async (userId, userRole, siteId) => {
  if (!siteId) {
    throw new Error('Site context required (X-Site-Id)');
  }

  const templates = await templateRepo.getAllTemplates(siteId);

  if (isPlatformAdmin(userRole)) {
    return templates;
  }

  // Within a site, show all site templates to members (builder collaboration)
  return templates;
};

const getTemplateById = async (id, userId, userRole, siteId) => {
  const template = await templateRepo.getTemplateById(id, siteId);
  if (!template) return null;
  assertSiteTemplateAccess(template, siteId, userId, userRole);
  return template;
};

const updateTemplate = async (id, templateData, userId, userRole, siteId) => {
  const currentTemplate = await templateRepo.getTemplateById(id, siteId);
  assertSiteTemplateAccess(currentTemplate, siteId, userId, userRole);

  if (templateData.layoutJson) {
    validateLayoutJson(templateData.layoutJson);
  }

  await templateRepo.saveTemplateHistory(
    currentTemplate.id,
    currentTemplate.version,
    currentTemplate.layoutJson,
    userId
  );

  const nextVersion = currentTemplate.version + 1;
  return await templateRepo.updateTemplate(id, templateData, nextVersion);
};

const deleteTemplate = async (id, userId, userRole, siteId) => {
  const currentTemplate = await templateRepo.getTemplateById(id, siteId);
  assertSiteTemplateAccess(currentTemplate, siteId, userId, userRole);
  return await templateRepo.deleteTemplate(id);
};

const publishTemplate = async (id, userId, userRole, siteId) => {
  const template = await templateRepo.getTemplateById(id, siteId);
  assertSiteTemplateAccess(template, siteId, userId, userRole);

  if (!template.layoutJson) {
    throw new Error('Cannot publish a template without a layoutJson');
  }
  return await templateRepo.publishTemplate(id);
};

const assignTemplate = async (id, assignData, userRole, siteId) => {
  if (!isPlatformAdmin(userRole) && !siteId) {
    throw new Error('Access denied. Only admins can assign templates without site context.');
  }

  const { categoryId, isGlobalDefault } = assignData;
  const template = await templateRepo.getTemplateById(id, siteId);
  if (!template) {
    throw new Error('Template not found');
  }
  if (template.status !== 'published') {
    throw new Error('Only published templates can be assigned');
  }

  return await templateRepo.assignTemplate(id, categoryId, isGlobalDefault, siteId);
};

const resolveActiveLayout = async (templateType, categoryId, siteId = null) => {
  if (!templateType) {
    throw new Error('templateType query parameter is required');
  }

  const layout = await templateRepo.resolveActiveLayout(
    templateType,
    categoryId || null,
    siteId != null && siteId !== '' ? Number(siteId) : null
  );

  if (!layout) {
    // Return null-friendly error for API; frontend falls back to default UI
    const err = new Error(
      `No active layout found for type "${templateType}"` +
        (categoryId ? ` and category "${categoryId}"` : '')
    );
    err.statusCode = 404;
    throw err;
  }

  return layout;
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  assignTemplate,
  resolveActiveLayout,
};
