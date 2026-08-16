'use strict';

function normalizeHomeLayoutData(input) {
  const props = input && typeof input === 'object' ? input : {};
  return {
    ...props,
    siteName: String(props.siteName || 'Site').trim() || 'Site',
    siteSlug: String(props.siteSlug || '').trim(),
    eyebrow: String(props.eyebrow || '').trim(),
    tagline: String(props.tagline || '').trim(),
    heroImage: props.heroImage || null,
    posts: Array.isArray(props.posts) ? props.posts.filter(Boolean) : [],
  };
}

module.exports = { normalizeHomeLayoutData };
