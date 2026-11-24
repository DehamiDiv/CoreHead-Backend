const prisma = require('../models/prismaClient');
const emailService = require('../services/emailService');

exports.subscribe = async (req, res) => {
  try {
    const { email, siteId, siteSlug } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    let resolvedSiteId = siteId ? parseInt(siteId, 10) : null;
    if (!resolvedSiteId && siteSlug) {
      const site = await prisma.site.findUnique({
        where: { slug: String(siteSlug).trim() },
        select: { id: true },
      });
      if (site) resolvedSiteId = site.id;
    }

    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'This email is already subscribed!' });
    }

    await prisma.newsletterSubscription.create({
      data: {
        email: normalizedEmail,
        siteId: resolvedSiteId || null,
        status: 'active',
      },
    });

    // Send a welcome email notification (best-effort)
    try {
      await emailService.sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to CoreHead Newsletter!',
        text: `Hi,\n\nThank you for subscribing to our newsletter!\n\nBest regards,\nThe CoreHead Team`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                 <h2 style="color: #2563eb; margin-top: 0;">Welcome!</h2>
                 <p>Thank you for subscribing to our newsletter. We will keep you updated with our latest stories and updates.</p>
               </div>`,
      });
    } catch (mailErr) {
      console.warn('Welcome email send failed (subscription saved):', mailErr.message);
    }

    return res.status(200).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while subscribing.' });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
    const subscribers = await prisma.newsletterSubscription.findMany({
      where: {
        OR: [{ siteId: req.siteId }, { siteId: null }],
        ...(search ? { email: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ subscribers });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Failed to load subscribers' });
  }
};

exports.exportSubscribersCsv = async (req, res) => {
  try {
    const subscribers = await prisma.newsletterSubscription.findMany({
      where: {
        OR: [{ siteId: req.siteId }, { siteId: null }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['ID', 'Email', 'Status', 'Subscribed At'].join(','),
      ...subscribers.map((s) =>
        [
          s.id,
          escapeCsv(s.email),
          escapeCsv(s.status),
          escapeCsv(new Date(s.createdAt).toISOString()),
        ].join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
    res.send(rows.join('\n'));
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.newsletterSubscription.findFirst({
      where: {
        id,
        OR: [{ siteId: req.siteId }, { siteId: null }],
      },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    await prisma.newsletterSubscription.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
};

async function dispatchCampaign(campaign) {
  const subscribers = await prisma.newsletterSubscription.findMany({
    where: {
      OR: [{ siteId: campaign.siteId }, { siteId: null }],
      status: 'active',
    },
    select: { email: true },
  });

  let sentCount = 0;
  for (const sub of subscribers) {
    try {
      await emailService.sendEmail({
        to: sub.email,
        subject: campaign.subject,
        text: campaign.contentHtml.replace(/<[^>]+>/g, ' ').trim(),
        html: campaign.contentHtml,
      });
      sentCount += 1;
    } catch (err) {
      console.warn(`Failed sending campaign ${campaign.id} to ${sub.email}:`, err.message);
    }
  }

  return prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      recipientCount: sentCount,
    },
  });
}

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.newsletterCampaign.findMany({
      where: { siteId: req.siteId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to load campaigns' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { subject, contentHtml, scheduledAt } = req.body || {};
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ error: 'Campaign subject is required' });
    }
    if (!contentHtml || !String(contentHtml).trim()) {
      return res.status(400).json({ error: 'Campaign content is required' });
    }

    const scheduleDate = scheduledAt ? new Date(scheduledAt) : null;
    const isFutureSchedule =
      scheduleDate && !Number.isNaN(scheduleDate.getTime()) && scheduleDate.getTime() > Date.now();

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        siteId: req.siteId,
        subject: String(subject).trim().slice(0, 255),
        contentHtml: String(contentHtml),
        status: isFutureSchedule ? 'scheduled' : 'sending',
        scheduledAt: isFutureSchedule ? scheduleDate : null,
      },
    });

    if (isFutureSchedule) {
      return res.status(201).json({ campaign, scheduled: true });
    }

    const sentCampaign = await dispatchCampaign(campaign);
    return res.status(201).json({ campaign: sentCampaign, scheduled: false });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.newsletterCampaign.findFirst({
      where: { id, siteId: req.siteId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    await prisma.newsletterCampaign.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

exports.processScheduledCampaigns = async () => {
  try {
    const due = await prisma.newsletterCampaign.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: new Date() },
      },
    });
    for (const campaign of due) {
      await dispatchCampaign(campaign);
    }
  } catch (error) {
    console.error('Scheduled campaign processor error:', error);
  }
};
