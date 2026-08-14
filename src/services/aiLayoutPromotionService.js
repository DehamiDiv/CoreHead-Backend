const { prepareTemplateLayout, kindToTemplateType } = require('../contracts/templateLayout');

function serviceError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

async function promoteAiLayout({ prisma, historyId, userId, siteId, name }) {
  const id = Number(historyId);
  if (!Number.isInteger(id) || id <= 0) throw serviceError('Invalid AI history ID.', 400);
  if (!siteId) throw serviceError('Site context is required.', 400);

  const history = await prisma.ai_layouts.findFirst({
    where: { id, user_id: Number(userId), site_id: Number(siteId) },
  });
  if (!history) throw serviceError('AI layout history was not found for this site.', 404);

  if (history.promoted_template_id) {
    const existing = await prisma.templates.findFirst({
      where: { id: history.promoted_template_id, siteId: Number(siteId) },
    });
    if (existing) return { template: existing, alreadyPromoted: true };
  }

  const type = kindToTemplateType(
    String(history.layout_type || '').toLowerCase().includes('archive')
      ? 'blog-archive'
      : 'single-post',
  );
  const templateName = String(name || history.generated_layout?.name || `AI ${type}`).trim();
  if (!templateName) throw serviceError('Template name is required.', 400);
  const prepared = prepareTemplateLayout(history.generated_layout, {
    name: templateName,
    type,
    status: 'draft',
    origin: 'ai',
  });

  const template = await prisma.$transaction(async (tx) => {
    const created = await tx.templates.create({
      data: {
        name: templateName,
        type,
        status: 'draft',
        layoutJson: prepared.layoutJson,
        authorId: Number(userId),
        siteId: Number(siteId),
      },
    });
    await tx.ai_layouts.update({
      where: { id },
      data: { promoted_template_id: created.id },
    });
    return created;
  });

  return {
    template,
    alreadyPromoted: false,
    warnings: prepared.warnings,
  };
}

module.exports = { promoteAiLayout };
