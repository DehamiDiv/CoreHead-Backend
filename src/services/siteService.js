const crypto = require('crypto');
const siteRepository = require('../repositories/siteRepository');
const prisma = require('../models/prismaClient');
const emailService = require('./emailService');

const MEMBER_ROLES = new Set(['EDITOR', 'AUTHOR']);
const INVITE_TTL_DAYS = 14;

/**
 * R2-4: Load public-safe appearance branding for a site from settings keys.
 * Keys mirror admin Appearance page: active_theme, theme_{id}_header|footer|colours|font
 */
/** Unwrap JSON strings (handles accidental double-stringify in settings.value). */
const parseSettingValue = (raw) => {
  if (raw === undefined || raw === null) return null;
  let cur = raw;
  for (let i = 0; i < 3; i += 1) {
    if (typeof cur !== 'string') break;
    const s = cur.trim();
    if (!s) return cur;
    // Only attempt parse for JSON-looking values
    if (!(s.startsWith('{') || s.startsWith('[') || s.startsWith('"'))) break;
    try {
      cur = JSON.parse(s);
    } catch {
      break;
    }
  }
  return cur;
};

const { mergeBranding } = require('../utils/themePresets');
const { extractHomeStyle } = require('../../../contracts/appearance-model-v1');

const loadPublicBranding = async (siteId) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { siteId: Number(siteId) },
    });
    const map = {};
    for (const row of settings) {
      map[row.key] = parseSettingValue(row.value);
    }

    const active = map.active_theme;
    const themeId =
      (active && (active.themeId || active.id || active)) || 'default';
    const themeKey = String(themeId);

    // Prefer site-level palette (Appearance → Colours) so custom colours always win
    // over stale theme packs / wrong active_theme keys.
    const coloursRaw =
      map.site_colours || map[`theme_${themeKey}_colours`] || {};
    const headerRaw =
      map.site_header || map[`theme_${themeKey}_header`] || {};
    const footerRaw =
      map.site_footer || map[`theme_${themeKey}_footer`] || {};
    const fontRaw = map.site_font || map[`theme_${themeKey}_font`] || {};
    // Site-level public home layout (Appearance → Homepage → Use layout)
    const homeLayoutRaw = map.home_layout || {};
    const homeStyleOverride = extractHomeStyle(homeLayoutRaw);

    const pickDefined = (obj) => {
      const out = {};
      if (!obj || typeof obj !== 'object') return out;
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== '') out[k] = v;
      }
      return out;
    };

    // Merge DB overrides with theme preset so public always has a full palette (R2-4)
    const branding = mergeBranding(
      themeKey,
      pickDefined({
        primary: coloursRaw.primary || coloursRaw.colourPrimary,
        background: coloursRaw.background,
        foreground: coloursRaw.foreground,
        accent: coloursRaw.accent,
        card: coloursRaw.card,
        cardForeground: coloursRaw.cardForeground,
        muted: coloursRaw.muted,
      }),
      pickDefined({
        headerBg: headerRaw.headerBg || headerRaw.bg,
        headerFont: headerRaw.headerFont || headerRaw.color,
        headerLogo: headerRaw.headerLogo,
        navLinks: Array.isArray(headerRaw.navLinks) ? headerRaw.navLinks : null,
        ctaText: headerRaw.ctaText,
        ctaUrl: headerRaw.ctaUrl,
        ctaBg: headerRaw.ctaBg,
        ctaColor: headerRaw.ctaColor,
      }),
      pickDefined({
        footerBg: footerRaw.footerBg,
        footerFont: footerRaw.footerFont,
        footerLogo: footerRaw.footerLogo,
        footerDescription: footerRaw.footerDescription,
        quickLinks: Array.isArray(footerRaw.quickLinks)
          ? footerRaw.quickLinks
          : null,
        copyrightText: footerRaw.copyrightText,
        socialLinks: Array.isArray(footerRaw.socialLinks)
          ? footerRaw.socialLinks
          : null,
      }),
      fontRaw.font || fontRaw.family || null,
      homeStyleOverride
    );

    const homeObj =
      homeLayoutRaw && typeof homeLayoutRaw === 'object' ? homeLayoutRaw : {};
    // Normalize pillars array (title/body only; empty rows dropped)
    let pillars = null;
    if (Array.isArray(homeObj.pillars)) {
      pillars = homeObj.pillars
        .map((p) => {
          if (!p || typeof p !== 'object') return null;
          const title = p.title != null ? String(p.title).trim() : '';
          const body = p.body != null ? String(p.body).trim() : '';
          if (!title && !body) return null;
          return pickDefined({ title: title || null, body: body || null });
        })
        .filter(Boolean);
      if (pillars.length === 0) pillars = null;
    }
    branding.home = pickDefined({
      homeStyle: branding.homeStyle,
      // Hero
      eyebrow: homeObj.eyebrow,
      tagline: homeObj.tagline,
      heroTitle: homeObj.heroTitle,
      heroImage: homeObj.heroImage,
      captionLeft: homeObj.captionLeft,
      captionRight: homeObj.captionRight,
      // Featured + side rail
      featuredEyebrow: homeObj.featuredEyebrow,
      featuredTitle: homeObj.featuredTitle,
      sideRailLabel: homeObj.sideRailLabel,
      // Pillars / services
      pillarsEyebrow: homeObj.pillarsEyebrow,
      pillarsTitle: homeObj.pillarsTitle,
      pillarsBody: homeObj.pillarsBody,
      pillars,
      // Latest
      latestEyebrow: homeObj.latestEyebrow,
      latestTitle: homeObj.latestTitle,
      // Bottom CTA
      ctaEyebrow: homeObj.ctaEyebrow,
      ctaTitle: homeObj.ctaTitle,
      ctaBody: homeObj.ctaBody,
      ctaButton: homeObj.ctaButton,
      ctaBackgroundImage: homeObj.ctaBackgroundImage,
      // Layout 6 · Paper portfolio pack
      socialLinks: Array.isArray(homeObj.socialLinks)
        ? homeObj.socialLinks
        : null,
      contactEmail: homeObj.contactEmail,
      contactPhone: homeObj.contactPhone,
      contactAddress: homeObj.contactAddress,
      aboutTitle: homeObj.aboutTitle,
      aboutDescription: homeObj.aboutDescription,
      aboutImage: homeObj.aboutImage,
      services: Array.isArray(homeObj.services) ? homeObj.services : null,
      videoUrl: homeObj.videoUrl,
      videoThumbnail: homeObj.videoThumbnail,
      testimonials: Array.isArray(homeObj.testimonials)
        ? homeObj.testimonials
        : null,
      clients: Array.isArray(homeObj.clients) ? homeObj.clients : null,
    });

    return branding;
  } catch (err) {
    console.warn('loadPublicBranding failed:', err.message);
    return null;
  }
};

/** Reserved slugs that must not be used as public site URLs */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'blog',
  'www',
  'app',
  'login',
  'signup',
  'register',
  'auth',
  'settings',
  'static',
  'uploads',
  'assets',
  's',
  'sites',
  'onboarding',
  'builder',
  'dashboard',
  'health',
  'preview',
]);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalize and validate a public site slug.
 * @returns {string} normalized slug
 */
const normalizeAndValidateSlug = (rawSlug) => {
  if (rawSlug === undefined || rawSlug === null || String(rawSlug).trim() === '') {
    throw Object.assign(new Error('Site slug is required'), { statusCode: 400 });
  }

  const slug = String(rawSlug).trim().toLowerCase();

  if (slug.length < 2 || slug.length > 100) {
    throw Object.assign(new Error('Slug must be between 2 and 100 characters'), {
      statusCode: 400,
    });
  }

  if (!SLUG_REGEX.test(slug)) {
    throw Object.assign(
      new Error(
        'Slug may only contain lowercase letters, numbers, and single hyphens (e.g. acme-foods)'
      ),
      { statusCode: 400 }
    );
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw Object.assign(new Error(`Slug "${slug}" is reserved. Please choose another.`), {
      statusCode: 400,
    });
  }

  return slug;
};

const normalizeName = (name) => {
  if (!name || String(name).trim() === '') {
    throw Object.assign(new Error('Site name is required'), { statusCode: 400 });
  }
  const trimmed = String(name).trim();
  if (trimmed.length > 255) {
    throw Object.assign(new Error('Site name must be 255 characters or less'), {
      statusCode: 400,
    });
  }
  return trimmed;
};

/**
 * Returns membership role if user can access the site, otherwise null.
 * Platform admins are treated as full access (OWNER-level for read/update checks).
 */
const getAccessRole = async (site, userId, userRole) => {
  if (!site) return null;

  const isPlatformAdmin =
    userRole &&
    (String(userRole).toLowerCase() === 'admin' ||
      String(userRole).toLowerCase() === 'administrator');

  if (isPlatformAdmin) return 'OWNER';
  if (site.ownerId === userId) return 'OWNER';

  const membership = await siteRepository.findMembership(site.id, userId);
  return membership ? membership.role : null;
};

const assertMember = async (site, userId, userRole) => {
  const role = await getAccessRole(site, userId, userRole);
  if (!role) {
    throw Object.assign(new Error('Access denied. You are not a member of this site.'), {
      statusCode: 403,
    });
  }
  return role;
};

const assertOwner = async (site, userId, userRole) => {
  const role = await assertMember(site, userId, userRole);
  if (role !== 'OWNER') {
    throw Object.assign(new Error('Access denied. Only the site owner can perform this action.'), {
      statusCode: 403,
    });
  }
  return role;
};

const createSite = async (userId, { name, slug, logo }) => {
  const normalizedName = normalizeName(name);
  const normalizedSlug = normalizeAndValidateSlug(slug);

  const existing = await siteRepository.findSiteBySlug(normalizedSlug);
  if (existing) {
    throw Object.assign(new Error('This site slug is already taken'), { statusCode: 409 });
  }

  return siteRepository.createSite({
    name: normalizedName,
    slug: normalizedSlug,
    ownerId: userId,
    logo: logo || null,
    status: 'active',
  });
};

const listMySites = async (userId) => {
  return siteRepository.findSitesForUser(userId);
};

const getSiteById = async (id, userId, userRole) => {
  const site = await siteRepository.findSiteById(id);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertMember(site, userId, userRole);
  return site;
};

/**
 * Public lookup by slug — only active sites (for future public blog routing).
 * If userId is provided, members can also see non-active sites they belong to.
 */
const getSiteBySlug = async (slug, userId = null, userRole = null) => {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  const site = await siteRepository.findSiteBySlug(normalizedSlug);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }

  let resolved = null;
  if (site.status === 'active') {
    resolved = site;
  } else if (userId) {
    // Non-active: only members / platform admin
    const role = await getAccessRole(site, userId, userRole);
    if (role) resolved = site;
  }

  if (!resolved) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }

  // Attach public branding (appearance) for tenant shell — R2-4
  const branding = await loadPublicBranding(resolved.id);
  return {
    ...resolved,
    branding: branding || undefined,
  };
};

const updateSite = async (id, userId, userRole, payload) => {
  const site = await siteRepository.findSiteById(id);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }

  // Name/logo: OWNER or EDITOR; slug/status: OWNER only
  const accessRole = await assertMember(site, userId, userRole);
  const isOwner = accessRole === 'OWNER';

  const data = {};

  if (payload.name !== undefined) {
    data.name = normalizeName(payload.name);
  }

  if (payload.logo !== undefined) {
    data.logo = payload.logo || null;
  }

  if (payload.slug !== undefined) {
    if (!isOwner) {
      throw Object.assign(new Error('Only the site owner can change the slug'), {
        statusCode: 403,
      });
    }
    const normalizedSlug = normalizeAndValidateSlug(payload.slug);
    if (normalizedSlug !== site.slug) {
      const existing = await siteRepository.findSiteBySlug(normalizedSlug);
      if (existing && existing.id !== site.id) {
        throw Object.assign(new Error('This site slug is already taken'), { statusCode: 409 });
      }
      data.slug = normalizedSlug;
    }
  }

  if (payload.status !== undefined) {
    if (!isOwner) {
      throw Object.assign(new Error('Only the site owner can change status'), {
        statusCode: 403,
      });
    }
    const allowed = ['active', 'suspended', 'archived'];
    if (!allowed.includes(payload.status)) {
      throw Object.assign(
        new Error(`Status must be one of: ${allowed.join(', ')}`),
        { statusCode: 400 }
      );
    }
    data.status = payload.status;
  }

  if (Object.keys(data).length === 0) {
    throw Object.assign(new Error('No valid fields to update'), { statusCode: 400 });
  }

  return siteRepository.updateSite(id, data);
};

const deleteSite = async (id, userId, userRole) => {
  const site = await siteRepository.findSiteById(id);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);
  await siteRepository.deleteSite(id);
  return { id: site.id, slug: site.slug };
};

const normalizeInviteRole = (role) => {
  const r = String(role || 'EDITOR').trim().toUpperCase();
  if (!MEMBER_ROLES.has(r)) {
    throw Object.assign(
      new Error('Invite role must be EDITOR or AUTHOR'),
      { statusCode: 400 }
    );
  }
  return r;
};

const normalizeEmail = (email) => {
  const e = String(email || '').trim().toLowerCase();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw Object.assign(new Error('A valid email is required'), {
      statusCode: 400,
    });
  }
  return e;
};

const buildInviteLink = (token) => {
  const base =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  return `${String(base).replace(/\/$/, '')}/invite/${token}`;
};

/**
 * R1-3: List members of a site (any site member / platform admin).
 */
const listMembers = async (siteId, userId, userRole) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertMember(site, userId, userRole);
  const members = await siteRepository.listMembers(siteId);
  return { site: { id: site.id, name: site.name, slug: site.slug }, members };
};

/**
 * R1-3: Invite by email.
 * - Existing CoreHead user → add SiteMember immediately
 * - Unknown email → pending SiteInvite + shareable link
 */
const inviteMember = async (siteId, actorId, actorRole, { email, role }) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, actorId, actorRole);

  const normalizedEmail = normalizeEmail(email);
  const inviteRole = normalizeInviteRole(role);

  // Already a member?
  const existingUser = await siteRepository.findUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMembership = await siteRepository.findMembership(
      siteId,
      existingUser.id
    );
    if (existingMembership) {
      throw Object.assign(
        new Error('This user is already a member of this site'),
        { statusCode: 409 }
      );
    }

    const member = await siteRepository.createMembership({
      siteId,
      userId: existingUser.id,
      role: inviteRole,
    });

    const loginUrl = `${String(
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '')}/login?callback=${encodeURIComponent(
      `/admin?site=${encodeURIComponent(site.slug)}`
    )}`;

    const emailResult = await emailService.sendEmail({
      to: normalizedEmail,
      subject: `You've been added to ${site.name} on CoreHead`,
      text: `You now have ${inviteRole} access to "${site.name}" on CoreHead.\n\nSign in: ${loginUrl}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
          <h2 style="margin:0 0 12px">You're on the team</h2>
          <p>You now have <strong>${inviteRole}</strong> access to <strong>${site.name}</strong> on CoreHead.</p>
          <p><a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open dashboard</a></p>
          <p style="color:#64748b;font-size:13px">Site: /s/${site.slug}</p>
        </div>
      `,
    });

    return {
      mode: 'added',
      member,
      emailSent: !!emailResult.sent,
      emailRealDelivery: !!emailResult.realDelivery,
      emailProvider: emailResult.provider || null,
      emailPreviewUrl: emailResult.previewUrl || null,
      emailError: emailResult.error || null,
      message: emailResult.sent
        ? `${normalizedEmail} was added as ${inviteRole}. Real email sent to their inbox.`
        : `${normalizedEmail} was added as ${inviteRole}. ${emailResult.error ||
        'No real email was sent — configure SMTP in backend .env'
        }`,
    };
  }

  // Pending invite for unknown email
  const existingInvite = await siteRepository.findPendingInviteBySiteEmail(
    siteId,
    normalizedEmail
  );
  if (existingInvite && existingInvite.expiresAt > new Date()) {
    const link = buildInviteLink(existingInvite.token);
    // Resend email for pending invite
    const emailResult = await emailService.sendEmail({
      to: normalizedEmail,
      subject: `Reminder: invite to join ${site.name} on CoreHead`,
      text: `You've been invited as ${inviteRole} to "${site.name}". Accept: ${link}`,
      html: inviteEmailHtml(site, inviteRole, link),
    });
    return {
      mode: 'pending',
      invite: {
        id: existingInvite.id,
        email: existingInvite.email,
        role: existingInvite.role,
        expiresAt: existingInvite.expiresAt,
        status: existingInvite.status,
      },
      inviteLink: link,
      emailSent: !!emailResult.sent,
      emailRealDelivery: !!emailResult.realDelivery,
      emailProvider: emailResult.provider || null,
      emailPreviewUrl: emailResult.previewUrl || null,
      emailError: emailResult.error || null,
      message: emailResult.sent
        ? `Invite email re-sent to ${normalizedEmail} (check their inbox).`
        : `Invite still pending. ${emailResult.error || 'Email not delivered to real inbox'
        }. Use the invite link below.`,
      resent: true,
    };
  }

  // Revoke stale pending invite if any
  if (existingInvite) {
    await siteRepository.revokeInvite(existingInvite.id);
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  const invite = await siteRepository.createInvite({
    siteId,
    email: normalizedEmail,
    role: inviteRole,
    token,
    invitedBy: actorId,
    expiresAt,
  });

  const inviteLink = buildInviteLink(token);

  const emailResult = await emailService.sendEmail({
    to: normalizedEmail,
    subject: `Invite to join ${site.name} on CoreHead`,
    text: `You've been invited as ${inviteRole} to "${site.name}". Accept: ${inviteLink}`,
    html: inviteEmailHtml(site, inviteRole, inviteLink),
  });

  return {
    mode: 'pending',
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      status: invite.status,
    },
    inviteLink,
    emailSent: !!emailResult.sent,
    emailRealDelivery: !!emailResult.realDelivery,
    emailProvider: emailResult.provider || null,
    emailPreviewUrl: emailResult.previewUrl || null,
    emailError: emailResult.error || null,
    message: emailResult.sent
      ? `Invite email sent to ${normalizedEmail} (check their inbox / spam).`
      : `Invite created. ${emailResult.error || 'Email was NOT sent to a real inbox'
      }. Copy the invite link below.`,
    resent: false,
  };
};

function inviteEmailHtml(site, inviteRole, inviteLink) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px">You're invited to ${site.name}</h2>
      <p>You've been invited as <strong>${inviteRole}</strong> on <strong>CoreHead</strong>.</p>
      <p><a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Accept invitation</a></p>
      <p style="color:#64748b;font-size:13px">Or open this link:<br/><a href="${inviteLink}">${inviteLink}</a></p>
      <p style="color:#94a3b8;font-size:12px">This link expires in ${INVITE_TTL_DAYS} days. Public site: /s/${site.slug}</p>
    </div>
  `;
}

const listInvites = async (siteId, userId, userRole) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);
  const invites = await siteRepository.listPendingInvites(siteId);
  return {
    site: { id: site.id, name: site.name, slug: site.slug },
    invites: invites.map((inv) => ({
      ...inv,
      inviteLink: buildInviteLink(inv.token),
      // Don't expose raw token beyond link for list? UI needs link; token is in link.
    })),
  };
};

const revokeInvite = async (siteId, inviteId, userId, userRole) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);

  const invites = await siteRepository.listPendingInvites(siteId);
  const invite = invites.find((i) => Number(i.id) === Number(inviteId));
  if (!invite) {
    // Also allow revoking by id even if already listed differently
    try {
      await siteRepository.revokeInvite(inviteId);
    } catch {
      throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
    }
    return { id: Number(inviteId), status: 'revoked' };
  }

  await siteRepository.revokeInvite(inviteId);
  return { id: Number(inviteId), status: 'revoked' };
};

const updateMemberRole = async (
  siteId,
  targetUserId,
  actorId,
  actorRole,
  role
) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, actorId, actorRole);

  if (Number(site.ownerId) === Number(targetUserId)) {
    throw Object.assign(new Error('Cannot change the site owner role'), {
      statusCode: 400,
    });
  }

  const membership = await siteRepository.findMembership(siteId, targetUserId);
  if (!membership) {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }

  const newRole = normalizeInviteRole(role);
  return siteRepository.updateMembershipRole(siteId, targetUserId, newRole);
};

const removeMember = async (siteId, targetUserId, actorId, actorRole) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, actorId, actorRole);

  if (Number(site.ownerId) === Number(targetUserId)) {
    throw Object.assign(new Error('Cannot remove the site owner'), {
      statusCode: 400,
    });
  }

  const membership = await siteRepository.findMembership(siteId, targetUserId);
  if (!membership) {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }

  await siteRepository.deleteMembership(siteId, targetUserId);
  return { userId: Number(targetUserId), removed: true };
};

/**
 * Public preview of an invite token (no auth).
 */
const getInviteByToken = async (token) => {
  const invite = await siteRepository.findInviteByToken(token);
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
  }

  if (invite.status !== 'pending') {
    throw Object.assign(new Error(`Invite is ${invite.status}`), {
      statusCode: 410,
    });
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    await siteRepository.updateInvite(invite.id, { status: 'expired' });
    throw Object.assign(new Error('Invite has expired'), { statusCode: 410 });
  }

  return {
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    site: invite.site,
    inviter: invite.inviter,
  };
};

/**
 * Accept invite — authenticated user email must match invite email.
 */
const acceptInvite = async (token, userId, userEmail) => {
  const invite = await siteRepository.findInviteByToken(token);
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { statusCode: 404 });
  }

  if (invite.status !== 'pending') {
    throw Object.assign(new Error(`Invite is ${invite.status}`), {
      statusCode: 410,
    });
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    await siteRepository.updateInvite(invite.id, { status: 'expired' });
    throw Object.assign(new Error('Invite has expired'), { statusCode: 410 });
  }

  let actorEmail = String(userEmail || '').trim().toLowerCase();
  if (!actorEmail && userId) {
    const me = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true },
    });
    actorEmail = String(me?.email || '')
      .trim()
      .toLowerCase();
  }
  if (!actorEmail || actorEmail !== String(invite.email).toLowerCase()) {
    throw Object.assign(
      new Error(
        `Sign in with ${invite.email} to accept this invitation`
      ),
      { statusCode: 403 }
    );
  }

  const existing = await siteRepository.findMembership(invite.siteId, userId);
  if (!existing) {
    await siteRepository.createMembership({
      siteId: invite.siteId,
      userId,
      role: invite.role,
    });
  }

  await siteRepository.updateInvite(invite.id, { status: 'accepted' });

  return {
    site: invite.site,
    role: invite.role,
    message: `You joined ${invite.site?.name || 'the site'} as ${invite.role}`,
  };
};

// ── R6: Custom domain + billing ────────────────────────────────────────────

const PLANS = new Set(['free', 'premium', 'enterprise']);
const PLAN_FEATURES = {
  free: {
    label: 'Free',
    priceMonthly: 0,
    customDomain: false,
    features: ['1 site', 'Posts & media', 'Public /s/{slug} URL', 'Team (owner only)'],
  },
  premium: {
    label: 'Premium',
    priceMonthly: 20,
    customDomain: true,
    features: [
      'Custom domain',
      'Everything in Free',
      'Priority support (demo)',
      '14-day trial available',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    priceMonthly: null,
    customDomain: true,
    features: [
      'Custom domain',
      'Everything in Premium',
      'Dedicated support (demo)',
      'Custom SLA (contact sales)',
    ],
  },
};

const normalizeDomain = (raw) => {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  let host = String(raw)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
  // strip trailing dot
  host = host.replace(/\.$/, '');
  if (host.startsWith('www.')) {
    // allow www. — store as given after www optional; keep as user typed without forcing
  }
  if (host.length < 3 || host.length > 255) {
    throw Object.assign(new Error('Domain must be between 3 and 255 characters'), {
      statusCode: 400,
    });
  }
  // basic hostname: labels with dots
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(host)) {
    throw Object.assign(
      new Error('Enter a valid domain (e.g. blog.acme.com)'),
      { statusCode: 400 }
    );
  }
  const reserved = new Set([
    'localhost',
    'corehead.app',
    'www.corehead.app',
    '127.0.0.1',
  ]);
  if (reserved.has(host)) {
    throw Object.assign(new Error('That domain is reserved by the platform'), {
      statusCode: 400,
    });
  }
  return host;
};

const planAllowsCustomDomain = (plan) => {
  const p = String(plan || 'free').toLowerCase();
  return PLAN_FEATURES[p]?.customDomain === true;
};

/**
 * Public: resolve verified custom domain → site (for middleware rewrite).
 */
const getSiteByDomain = async (domain) => {
  const host = normalizeDomain(domain);
  if (!host) {
    throw Object.assign(new Error('Domain is required'), { statusCode: 400 });
  }
  const site = await siteRepository.findSiteByDomain(host);
  if (!site) {
    throw Object.assign(new Error('No site found for this domain'), {
      statusCode: 404,
    });
  }
  const branding = await loadPublicBranding(site.id);
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    logo: site.logo,
    status: site.status,
    customDomain: site.customDomain,
    domainStatus: site.domainStatus,
    branding: branding || undefined,
  };
};

/**
 * Owner: set or clear custom domain (Premium+).
 * Body: { domain: string | null }
 */
const setCustomDomain = async (siteId, userId, userRole, { domain }) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);

  // Clear domain only when explicitly null or empty string
  if (domain === null || domain === '') {
    const updated = await siteRepository.updateSite(siteId, {
      customDomain: null,
      domainStatus: 'unconfigured',
      domainVerifyToken: null,
    });
    return {
      site: updated,
      message: 'Custom domain removed',
    };
  }

  if (domain === undefined) {
    throw Object.assign(new Error('domain is required (string or null to clear)'), {
      statusCode: 400,
    });
  }

  if (!planAllowsCustomDomain(site.plan)) {
    throw Object.assign(
      new Error(
        'Custom domains require Premium or Enterprise. Upgrade under Billing.'
      ),
      { statusCode: 402 }
    );
  }

  const host = normalizeDomain(domain);
  const taken = await siteRepository.findSiteByDomainAnyStatus(host);
  if (taken && Number(taken.id) !== Number(site.id)) {
    throw Object.assign(new Error('This domain is already linked to another site'), {
      statusCode: 409,
    });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const updated = await siteRepository.updateSite(siteId, {
    customDomain: host,
    domainStatus: 'pending',
    domainVerifyToken: token,
  });

  return {
    site: updated,
    message: 'Domain saved. Add the DNS record below, then verify.',
    dns: {
      type: 'TXT',
      host: `_corehead.${host}`,
      value: `corehead-verify=${token}`,
      note: 'Or CNAME your domain to the CoreHead host (see admin instructions).',
    },
  };
};

/**
 * Owner: verify custom domain.
 * Tries live DNS TXT lookup for `_corehead.{domain}` = `corehead-verify={token}`.
 * Body: { force?: boolean } — force skips DNS (local demo / DNS lag).
 */
const verifyCustomDomain = async (siteId, userId, userRole, { force } = {}) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);

  if (!site.customDomain) {
    throw Object.assign(new Error('No custom domain configured'), {
      statusCode: 400,
    });
  }
  if (!planAllowsCustomDomain(site.plan)) {
    throw Object.assign(
      new Error('Custom domains require Premium or Enterprise'),
      { statusCode: 402 }
    );
  }

  const expected = `corehead-verify=${site.domainVerifyToken || ''}`;
  const txtHost = `_corehead.${site.customDomain}`;
  let dnsOk = false;
  let dnsDetail = null;

  if (!force && site.domainVerifyToken) {
    try {
      const dns = require('dns').promises;
      const records = await dns.resolveTxt(txtHost);
      const flat = records.map((r) => (Array.isArray(r) ? r.join('') : String(r)));
      dnsOk = flat.some((v) => v.includes(expected));
      dnsDetail = dnsOk
        ? 'TXT record matched'
        : `TXT at ${txtHost} did not include expected token`;
    } catch (err) {
      dnsDetail = `DNS lookup failed: ${err.message}`;
      dnsOk = false;
    }
  }

  if (!dnsOk && !force) {
    throw Object.assign(
      new Error(
        dnsDetail
          ? `${dnsDetail}. Add the TXT record and try again, or verify with force for demo.`
          : 'DNS verification failed. Use force for local demo.'
      ),
      { statusCode: 400, dnsDetail }
    );
  }

  const updated = await siteRepository.updateSite(siteId, {
    domainStatus: 'verified',
  });

  return {
    site: updated,
    message: force
      ? `Domain ${site.customDomain} marked verified (forced / demo)`
      : `Domain ${site.customDomain} verified via DNS`,
    dns: { host: txtHost, matched: dnsOk, detail: dnsDetail, forced: !!force },
  };
};

/**
 * Billing summary for a site (owner / member can view).
 */
const getBilling = async (siteId, userId, userRole) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertMember(site, userId, userRole);

  const planKey = String(site.plan || 'free').toLowerCase();
  const planInfo = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;

  return {
    site: {
      id: site.id,
      name: site.name,
      slug: site.slug,
      plan: planKey,
      planStatus: site.planStatus || 'active',
      planUpdatedAt: site.planUpdatedAt,
      customDomain: site.customDomain,
      domainStatus: site.domainStatus,
    },
    currentPlan: planInfo,
    plans: Object.entries(PLAN_FEATURES).map(([id, info]) => ({
      id,
      ...info,
      current: id === planKey,
    })),
    note:
      'Demo billing — no payment processor. Upgrades apply immediately for this site.',
  };
};

/**
 * Owner: change plan (demo, no Stripe).
 * Body: { plan: 'free' | 'premium' | 'enterprise', planStatus?: 'active' | 'trial' }
 */
const updatePlan = async (siteId, userId, userRole, { plan, planStatus }) => {
  const site = await siteRepository.findSiteById(siteId);
  if (!site) {
    throw Object.assign(new Error('Site not found'), { statusCode: 404 });
  }
  await assertOwner(site, userId, userRole);

  const nextPlan = String(plan || '').trim().toLowerCase();
  if (!PLANS.has(nextPlan)) {
    throw Object.assign(
      new Error(`Plan must be one of: ${[...PLANS].join(', ')}`),
      { statusCode: 400 }
    );
  }

  let nextStatus = planStatus
    ? String(planStatus).toLowerCase()
    : nextPlan === 'premium' && site.plan === 'free'
      ? 'trial'
      : 'active';
  if (!['active', 'trial', 'canceled'].includes(nextStatus)) {
    nextStatus = 'active';
  }

  const data = {
    plan: nextPlan,
    planStatus: nextStatus,
    planUpdatedAt: new Date(),
  };

  // Downgrade to free: clear custom domain
  if (nextPlan === 'free' && site.customDomain) {
    data.customDomain = null;
    data.domainStatus = 'unconfigured';
    data.domainVerifyToken = null;
  }

  const updated = await siteRepository.updateSite(siteId, data);
  return {
    site: updated,
    message: `Plan updated to ${PLAN_FEATURES[nextPlan]?.label || nextPlan}`,
    billing: await getBilling(siteId, userId, userRole),
  };
};

module.exports = {
  createSite,
  listMySites,
  getSiteById,
  getSiteBySlug,
  updateSite,
  deleteSite,
  normalizeAndValidateSlug,
  listMembers,
  inviteMember,
  listInvites,
  revokeInvite,
  updateMemberRole,
  removeMember,
  getInviteByToken,
  acceptInvite,
  getSiteByDomain,
  setCustomDomain,
  verifyCustomDomain,
  getBilling,
  updatePlan,
  PLAN_FEATURES,
};
