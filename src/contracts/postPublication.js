const POST_STATUS = Object.freeze({
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  UNPUBLISHED: 'Unpublished',
});

/** Normalize persisted and user-provided status aliases to the public contract. */
function normalizePostStatus(raw, fallback = POST_STATUS.DRAFT) {
  const value = String(raw ?? fallback).trim().toLowerCase();
  if (value === 'published' || value === 'publish' || value === 'live') {
    return POST_STATUS.PUBLISHED;
  }
  if (value === 'unpublished' || value === 'unpublish' || value === 'private') {
    return POST_STATUS.UNPUBLISHED;
  }
  return POST_STATUS.DRAFT;
}

/** A legacy isPublished flag remains public-compatible during status migration. */
function isPublicPost(post) {
  return Boolean(
    post &&
      (post.isPublished === true ||
        normalizePostStatus(post.status) === POST_STATUS.PUBLISHED)
  );
}

/** Prisma predicate shared by public archive and single-post resolution. */
function publicPostWhere(siteId, additional = {}) {
  return {
    ...additional,
    siteId: Number(siteId),
    OR: [
      { status: { in: [POST_STATUS.PUBLISHED, 'published'] } },
      { isPublished: true },
    ],
  };
}

/** Keep status, publication flag, and first publication time synchronized. */
function buildPostStatusFields(statusInput, options = {}) {
  const status = normalizePostStatus(statusInput);
  const published = status === POST_STATUS.PUBLISHED;
  let publishedAt = options.previousPublishedAt ?? null;

  if (published) {
    if (options.publishedDate) {
      const requestedDate = new Date(options.publishedDate);
      publishedAt = Number.isNaN(requestedDate.getTime())
        ? publishedAt || new Date()
        : requestedDate;
    } else if (!publishedAt) {
      publishedAt = new Date();
    }
  }

  return {
    status,
    isPublished: published,
    // Retain the original publication time when a post is unpublished.
    publishedAt,
  };
}

module.exports = {
  POST_STATUS,
  normalizePostStatus,
  isPublicPost,
  publicPostWhere,
  buildPostStatusFields,
};
