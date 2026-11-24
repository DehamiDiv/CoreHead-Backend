const prisma = require('../models/prismaClient');
const { isPlatformAdmin } = require('../utils/siteScope');

/**
 * Public endpoint: submit a contact / lead form from a rendered site page.
 * Resolves siteId from explicit body.siteId or body.siteSlug.
 */
const submitForm = async (req, res) => {
  try {
    const { siteId, siteSlug, formTitle, name, email, subject, message } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let resolvedSiteId = siteId ? parseInt(siteId, 10) : null;
    if (!resolvedSiteId && siteSlug) {
      const site = await prisma.site.findUnique({
        where: { slug: String(siteSlug).trim() },
        select: { id: true },
      });
      if (site) resolvedSiteId = site.id;
    }

    const submission = await prisma.formSubmission.create({
      data: {
        siteId: resolvedSiteId || null,
        formTitle: formTitle ? String(formTitle).slice(0, 255) : 'Contact Form',
        name: String(name).trim().slice(0, 255),
        email: String(email).trim().slice(0, 255),
        subject: subject ? String(subject).trim().slice(0, 255) : null,
        message: String(message).trim(),
        status: 'unread',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Submission received',
      submission,
    });
  } catch (error) {
    console.error('Form submit error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
};

/**
 * Admin endpoint: list contact form submissions for the active site.
 */
const getSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { siteId: req.siteId };
    if (status && ['unread', 'read', 'archived'].includes(String(status))) {
      where.status = String(status);
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to load form submissions' });
  }
};

/**
 * Admin endpoint: update submission status (unread | read | archived).
 */
const updateSubmissionStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body || {};
    if (!['unread', 'read', 'archived'].includes(String(status))) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.formSubmission.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: { status: String(status) },
    });
    res.json({ submission: updated });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
};

/**
 * Admin endpoint: delete a submission.
 */
const deleteSubmission = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.formSubmission.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const siteRole = String(req.siteRole || '').toUpperCase();
    if (!isPlatformAdmin(req.user.role) && siteRole !== 'OWNER' && siteRole !== 'EDITOR') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.formSubmission.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
};

module.exports = {
  submitForm,
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
};
