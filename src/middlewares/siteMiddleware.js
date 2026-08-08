const prisma = require('../models/prismaClient');
const { getSiteIdFromRequest, isPlatformAdmin } = require('../utils/siteScope');

/**
 * Require a valid site context (X-Site-Id / siteId query / body).
 * When the user is authenticated, verifies membership (or platform admin / owner).
 * Sets: req.siteId, req.site, req.siteRole
 */
/**
 * T15: Protected site context — requires authenticated user + membership.
 * Always use AFTER authMiddleware on admin/content routes.
 */
const requireSite = async (req, res, next) => {
  try {
    // Must be authenticated (prevents X-Site-Id-only access to admin APIs)
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    const siteId = getSiteIdFromRequest(req);

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error:
          'Site context required. Send X-Site-Id header (or siteId query/body).',
      });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found.',
      });
    }

    // Suspended / archived sites cannot be managed
    if (site.status && String(site.status).toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'This site is not active.',
      });
    }

    let siteRole = null;

    if (isPlatformAdmin(req.user.role)) {
      siteRole = 'OWNER';
    } else if (site.ownerId === req.user.id) {
      siteRole = 'OWNER';
    } else {
      const membership = await prisma.siteMember.findUnique({
        where: {
          siteId_userId: {
            siteId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not a member of this site.',
        });
      }
      siteRole = membership.role;
    }

    req.siteId = siteId;
    req.site = site;
    req.siteRole = siteRole;
    next();
  } catch (error) {
    console.error('requireSite error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve site context.',
    });
  }
};

/**
 * Attach site context when present; do not fail when missing.
 * Useful for public routes (e.g. post by slug with optional site filter).
 */
/**
 * Public site context (no membership required).
 * Only attaches active sites; ignores inactive/missing without leaking existence
 * when used carefully by callers.
 */
const optionalSite = async (req, res, next) => {
  try {
    const siteId = getSiteIdFromRequest(req);
    if (!siteId) {
      req.siteId = null;
      req.site = null;
      return next();
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site || (site.status && String(site.status).toLowerCase() !== 'active')) {
      // Treat inactive as not found for public callers
      return res.status(404).json({
        success: false,
        error: 'Site not found.',
      });
    }

    req.siteId = siteId;
    req.site = site;
    next();
  } catch (error) {
    console.error('optionalSite error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve site context.',
    });
  }
};

/**
 * Ensure a loaded resource belongs to the current site (no cross-site leakage).
 */
const assertSameSite = (resourceSiteId, reqSiteId) => {
  if (resourceSiteId == null || reqSiteId == null) return false;
  return Number(resourceSiteId) === Number(reqSiteId);
};

module.exports = {
  requireSite,
  optionalSite,
  assertSameSite,
};
