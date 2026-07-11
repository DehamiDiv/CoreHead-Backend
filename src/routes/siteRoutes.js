const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authMiddleware = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

/**
 * Optional auth: attach req.user when a valid Bearer token is present,
 * but do not fail when missing (used for public by-slug lookups).
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corehead_secret_key_123');
      req.user = decoded;
    }
  } catch {
    // Ignore invalid token for optional routes; treat as anonymous
  }
  next();
};

// POST /api/sites — create site (auth)
router.post('/', authMiddleware, siteController.createSite);

// GET /api/sites — list my sites (auth)
router.get('/', authMiddleware, siteController.listMySites);

// GET /api/sites/by-slug/:slug — public for active sites (optional auth)
// Must be registered BEFORE /:id so "by-slug" is not captured as an id.
router.get('/by-slug/:slug', optionalAuth, siteController.getSiteBySlug);

// R6: public domain resolve (before /:id)
router.get('/by-domain/:domain', siteController.getSiteByDomain);

// ── R1-3: members & invites (before bare /:id where needed) ────────────────
router.get('/:id/members', authMiddleware, siteController.listMembers);
router.post('/:id/members/invite', authMiddleware, siteController.inviteMember);
router.patch('/:id/members/:userId', authMiddleware, siteController.updateMemberRole);
router.delete('/:id/members/:userId', authMiddleware, siteController.removeMember);
router.get('/:id/invites', authMiddleware, siteController.listInvites);
router.delete('/:id/invites/:inviteId', authMiddleware, siteController.revokeInvite);

// ── R6: domain + billing ───────────────────────────────────────────────────
router.put('/:id/domain', authMiddleware, siteController.setCustomDomain);
router.post('/:id/domain/verify', authMiddleware, siteController.verifyCustomDomain);
router.get('/:id/billing', authMiddleware, siteController.getBilling);
router.put('/:id/billing/plan', authMiddleware, siteController.updatePlan);

// GET /api/sites/:id — get one site (auth + membership)
router.get('/:id', authMiddleware, siteController.getSiteById);

// PATCH /api/sites/:id — update site (auth + membership/owner rules)
router.patch('/:id', authMiddleware, siteController.updateSite);

// DELETE /api/sites/:id — delete site (auth + owner)
router.delete('/:id', authMiddleware, siteController.deleteSite);

module.exports = router;
