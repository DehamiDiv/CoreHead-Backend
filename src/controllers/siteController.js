const siteService = require('../services/siteService');

const getUserId = (req) => req.user?.id;
const getUserRole = (req) => req.user?.role;

const handleError = (res, error, fallbackMessage) => {
  const status = error.statusCode || 500;
  if (status >= 500) {
    console.error(fallbackMessage, error);
  }
  return res.status(status).json({
    success: false,
    error: error.message || fallbackMessage,
  });
};

/**
 * POST /api/sites
 * Body: { name, slug, logo? }
 */
exports.createSite = async (req, res) => {
  try {
    const userId = getUserId(req);
    const site = await siteService.createSite(userId, req.body || {});
    return res.status(201).json({
      success: true,
      message: 'Site created successfully',
      site,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to create site');
  }
};

/**
 * GET /api/sites
 * Lists sites the authenticated user owns or belongs to.
 */
exports.listMySites = async (req, res) => {
  try {
    const userId = getUserId(req);
    const sites = await siteService.listMySites(userId);
    return res.status(200).json({
      success: true,
      sites,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to list sites');
  }
};

/**
 * GET /api/sites/by-slug/:slug
 * Public for active sites; optional Bearer token for non-active member access.
 */
exports.getSiteBySlug = async (req, res) => {
  try {
    const site = await siteService.getSiteBySlug(
      req.params.slug,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({
      success: true,
      site,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch site');
  }
};

/**
 * GET /api/sites/:id
 * Member (or platform admin) only.
 */
exports.getSiteById = async (req, res) => {
  try {
    const site = await siteService.getSiteById(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({
      success: true,
      site,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch site');
  }
};

/**
 * PATCH /api/sites/:id
 * Body: { name?, slug?, logo?, status? }
 */
exports.updateSite = async (req, res) => {
  try {
    const site = await siteService.updateSite(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body || {}
    );
    return res.status(200).json({
      success: true,
      message: 'Site updated successfully',
      site,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to update site');
  }
};

/**
 * DELETE /api/sites/:id
 * Owner (or platform admin) only.
 */
exports.deleteSite = async (req, res) => {
  try {
    const deleted = await siteService.deleteSite(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({
      success: true,
      message: 'Site deleted successfully',
      deleted,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to delete site');
  }
};

// ── R1-3 Team / invites ────────────────────────────────────────────────────

/** GET /api/sites/:id/members */
exports.listMembers = async (req, res) => {
  try {
    const data = await siteService.listMembers(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return handleError(res, error, 'Failed to list members');
  }
};

/** POST /api/sites/:id/members/invite  body: { email, role } */
exports.inviteMember = async (req, res) => {
  try {
    const result = await siteService.inviteMember(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body || {}
    );
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to invite member');
  }
};

/** PATCH /api/sites/:id/members/:userId  body: { role } */
exports.updateMemberRole = async (req, res) => {
  try {
    const member = await siteService.updateMemberRole(
      req.params.id,
      req.params.userId,
      getUserId(req),
      getUserRole(req),
      req.body?.role
    );
    return res.status(200).json({
      success: true,
      message: 'Member role updated',
      member,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to update member role');
  }
};

/** DELETE /api/sites/:id/members/:userId */
exports.removeMember = async (req, res) => {
  try {
    const result = await siteService.removeMember(
      req.params.id,
      req.params.userId,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({
      success: true,
      message: 'Member removed',
      ...result,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to remove member');
  }
};

/** GET /api/sites/:id/invites */
exports.listInvites = async (req, res) => {
  try {
    const data = await siteService.listInvites(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return handleError(res, error, 'Failed to list invites');
  }
};

/** DELETE /api/sites/:id/invites/:inviteId */
exports.revokeInvite = async (req, res) => {
  try {
    const result = await siteService.revokeInvite(
      req.params.id,
      req.params.inviteId,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({
      success: true,
      message: 'Invite revoked',
      ...result,
    });
  } catch (error) {
    return handleError(res, error, 'Failed to revoke invite');
  }
};

/** GET /api/invites/:token — public preview */
exports.getInviteByToken = async (req, res) => {
  try {
    const invite = await siteService.getInviteByToken(req.params.token);
    return res.status(200).json({ success: true, invite });
  } catch (error) {
    return handleError(res, error, 'Failed to load invite');
  }
};

/** POST /api/invites/:token/accept — auth required */
exports.acceptInvite = async (req, res) => {
  try {
    const result = await siteService.acceptInvite(
      req.params.token,
      getUserId(req),
      req.user?.email
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to accept invite');
  }
};

// ── R6 Domain + billing ────────────────────────────────────────────────────

/** GET /api/sites/by-domain/:domain — public (verified domains only) */
exports.getSiteByDomain = async (req, res) => {
  try {
    const site = await siteService.getSiteByDomain(req.params.domain);
    return res.status(200).json({ success: true, site });
  } catch (error) {
    return handleError(res, error, 'Failed to resolve domain');
  }
};

/** PUT /api/sites/:id/domain  body: { domain: string | null } */
exports.setCustomDomain = async (req, res) => {
  try {
    const result = await siteService.setCustomDomain(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to set custom domain');
  }
};

/** POST /api/sites/:id/domain/verify  body: { force?: boolean } */
exports.verifyCustomDomain = async (req, res) => {
  try {
    const result = await siteService.verifyCustomDomain(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to verify domain');
  }
};

/** GET /api/sites/:id/billing */
exports.getBilling = async (req, res) => {
  try {
    const billing = await siteService.getBilling(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    return res.status(200).json({ success: true, ...billing });
  } catch (error) {
    return handleError(res, error, 'Failed to load billing');
  }
};

/** PUT /api/sites/:id/billing/plan  body: { plan, planStatus? } */
exports.updatePlan = async (req, res) => {
  try {
    const result = await siteService.updatePlan(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body || {}
    );
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to update plan');
  }
};
