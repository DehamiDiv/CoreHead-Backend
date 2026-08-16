const { normalizeLayoutDocumentV1 } = require('./layout-normalizer-v1');
const { validateLayoutDocumentV1 } = require('./layout-validator-v1');

function prepareRenderableLayout(input, options = {}) {
  const normalized = normalizeLayoutDocumentV1(input, {
    name: options.name,
    kind: options.kind,
    origin: options.origin || 'migrated',
    designStyle: options.designStyle,
  });
  const document = {
    ...normalized.document,
    ...(options.name ? { name: options.name } : {}),
    ...(options.kind ? { kind: options.kind } : {}),
  };
  const validation = validateLayoutDocumentV1(document, {
    semantic: options.semantic !== false,
  });
  return {
    document,
    valid: validation.valid,
    sourceFormat: normalized.sourceFormat,
    issues: [...normalized.warnings, ...validation.warnings, ...validation.errors],
  };
}

module.exports = { prepareRenderableLayout };
