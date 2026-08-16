function templateTypeToKind(type) {
  const value = String(type || '').trim().toLowerCase();
  const words = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (words === 'home' || words.includes('home page') || words.includes('homepage')) {
    return 'home-page';
  }
  if (value.includes('archive') || value.includes('loop') || value.includes('collection') || value === 'list') {
    return 'blog-archive';
  }
  if (value.includes('single') || ['blog', 'post', 'single_post', 'single-post'].includes(value)) {
    return 'single-post';
  }
  return null;
}

function layoutKindFromTemplate(template) {
  const documentKind = template?.layoutJson?.kind;
  if (documentKind === 'single-post' || documentKind === 'blog-archive' || documentKind === 'home-page') return documentKind;
  return templateTypeToKind(template?.type);
}

function isPublishedTemplate(template) {
  return String(template?.status || '').trim().toLowerCase() === 'published';
}

function templateOrigin(template) {
  const origin = template?.layoutJson?.metadata?.origin;
  if (['manual', 'ai', 'imported', 'migrated'].includes(origin)) return origin;
  return template?.layoutJson?.schemaVersion === '1.0' ? 'manual' : 'migrated';
}

module.exports = {
  isPublishedTemplate,
  layoutKindFromTemplate,
  templateOrigin,
  templateTypeToKind,
};
