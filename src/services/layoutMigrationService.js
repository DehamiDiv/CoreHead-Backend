const { prepareTemplateLayout } = require('../contracts/templateLayout');

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function auditAndMigrateTemplates({ prisma, apply = false, siteId = null }) {
  const templates = await prisma.templates.findMany({
    where: siteId != null ? { siteId: Number(siteId) } : undefined,
    orderBy: { id: 'asc' },
  });
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    scanned: templates.length,
    migratable: 0,
    migrated: 0,
    skipped: 0,
    invalid: 0,
    entries: [],
  };

  for (const template of templates) {
    try {
      const alreadyCanonical = template.layoutJson?.schemaVersion === '1.0';
      const prepared = prepareTemplateLayout(template.layoutJson, {
        name: template.name,
        type: template.type,
        status: template.status,
        origin: alreadyCanonical
          ? template.layoutJson?.metadata?.origin || 'manual'
          : 'migrated',
      });
      if (alreadyCanonical && sameJson(prepared.layoutJson, template.layoutJson)) {
        report.skipped += 1;
        report.entries.push({ id: template.id, status: 'skipped', reason: 'already-canonical' });
        continue;
      }

      report.migratable += 1;
      if (!apply) {
        report.entries.push({
          id: template.id,
          status: 'migratable',
          sourceFormat: prepared.sourceFormat,
          warnings: prepared.warnings,
        });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.templateHistory.create({
          data: {
            templateId: template.id,
            version: template.version,
            layoutJson: template.layoutJson,
            updatedBy: template.authorId,
          },
        });
        await tx.templates.update({
          where: { id: template.id },
          data: {
            layoutJson: prepared.layoutJson,
            version: template.version + 1,
          },
        });
      });
      report.migrated += 1;
      report.entries.push({
        id: template.id,
        status: 'migrated',
        sourceFormat: prepared.sourceFormat,
        warnings: prepared.warnings,
      });
    } catch (error) {
      report.invalid += 1;
      report.entries.push({
        id: template.id,
        status: 'invalid',
        reason: error.message,
        validationErrors: error.validationErrors || [],
      });
    }
  }

  return report;
}

module.exports = { auditAndMigrateTemplates };
