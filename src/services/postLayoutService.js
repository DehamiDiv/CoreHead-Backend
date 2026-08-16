const prisma = require('../models/prismaClient');
const {
  assertAssignableTemplate,
  templateTypeToKind,
} = require('../contracts/templateLayout');

function requestError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

async function validatePostLayoutOverride(layoutTemplateId, siteId) {
  if (layoutTemplateId === undefined) return undefined;
  if (layoutTemplateId === null || layoutTemplateId === '') return null;

  const templateId = Number(layoutTemplateId);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw requestError('layoutTemplateId must be a positive template ID or null.');
  }
  if (!siteId) {
    throw requestError('Site context is required to select a post layout.');
  }

  const template = await prisma.templates.findFirst({
    where: { id: templateId, siteId: Number(siteId) },
  });
  if (!template) {
    throw requestError('Selected post layout was not found for this site.', 404);
  }
  if (templateTypeToKind(template.type) !== 'single-post') {
    throw requestError('Only a published Single Post layout can be selected for a post.');
  }

  const prepared = assertAssignableTemplate(template);
  if (prepared.layoutJson.kind !== 'single-post') {
    throw requestError('Selected template is not a Single Post layout.');
  }
  return template.id;
}

module.exports = { validatePostLayoutOverride };
