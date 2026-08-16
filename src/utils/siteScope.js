/**
 * Resolve site id from header, query, or body.
 * Preferred: X-Site-Id header.
 */
const getSiteIdFromRequest = (req) => {
  const raw =
    req.headers['x-site-id'] ??
    req.query?.siteId ??
    req.body?.siteId;

  if (raw === undefined || raw === null || raw === '') return null;

  const id = parseInt(String(raw), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const isPlatformAdmin = (role) => {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'administrator';
};

module.exports = {
  getSiteIdFromRequest,
  isPlatformAdmin,
};
