const {
  normalizeLayoutDocumentV1,
  validateLayoutDocumentV1,
} = require('./layoutContract');

function templateTypeToKind(type) {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized.includes('archive') || normalized.includes('loop') || normalized.includes('collection') || normalized === 'list') {
    return 'blog-archive';
  }
  return 'single-post';
}

function kindToTemplateType(kind) {
  return kind === 'blog-archive' ? 'Blog Archive' : 'Single Post';
}

function isPublishedStatus(status) {
  return String(status || '').trim().toLowerCase() === 'published';
}

function prepareTemplateLayout(layoutJson, options = {}) {
  const kind = templateTypeToKind(options.type);
  const normalized = normalizeLayoutDocumentV1(layoutJson, {
    name: options.name,
    kind,
    origin: options.origin || 'manual',
  });
  const document = {
    ...normalized.document,
    name: String(options.name || normalized.document.name).trim(),
    kind,
    metadata: {
      ...normalized.document.metadata,
      origin: options.origin || normalized.document.metadata?.origin || 'manual',
    },
  };
  const validation = validateLayoutDocumentV1(document, {
    semantic: isPublishedStatus(options.status),
  });

  if (!validation.valid) {
    const error = new Error(
      validation.errors.map((issue) => `${issue.path}: ${issue.message}`).join('\n'),
    );
    error.name = 'LayoutValidationError';
    error.statusCode = 400;
    error.validationErrors = validation.errors;
    error.validationWarnings = [...normalized.warnings, ...validation.warnings];
    throw error;
  }

  return {
    layoutJson: document,
    sourceFormat: normalized.sourceFormat,
    warnings: [...normalized.warnings, ...validation.warnings],
  };
}

function assertAssignableTemplate(template) {
  if (!template) throw Object.assign(new Error('Template not found'), { statusCode: 404 });
  if (!isPublishedStatus(template.status)) {
    throw Object.assign(new Error('Only published templates can be assigned'), { statusCode: 400 });
  }
  return prepareTemplateLayout(template.layoutJson, {
    name: template.name,
    type: template.type,
    status: 'published',
    origin: template.layoutJson?.metadata?.origin || 'manual',
  });
}

module.exports = {
  assertAssignableTemplate,
  isPublishedStatus,
  kindToTemplateType,
  prepareTemplateLayout,
  templateTypeToKind,
};
