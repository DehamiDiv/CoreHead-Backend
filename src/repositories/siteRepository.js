const prisma = require('../models/prismaClient');

const siteInclude = {
  owner: {
    select: { id: true, email: true, name: true, avatar: true },
  },
  members: {
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
  },
  _count: {
    select: { members: true },
  },
};

const createSite = async ({ name, slug, ownerId, status = 'active', logo = null }) => {
  return prisma.site.create({
    data: {
      name,
      slug,
      ownerId,
      status,
      logo,
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: siteInclude,
  });
};

const findSiteById = async (id) => {
  return prisma.site.findUnique({
    where: { id: Number(id) },
    include: siteInclude,
  });
};

const findSiteBySlug = async (slug) => {
  return prisma.site.findUnique({
    where: { slug },
    include: siteInclude,
  });
};

/** R6: resolve site by custom domain host (lowercase, no port) */
const findSiteByDomain = async (domain) => {
  const host = String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (!host) return null;
  return prisma.site.findFirst({
    where: {
      customDomain: host,
      domainStatus: "verified",
      status: "active",
    },
    include: siteInclude,
  });
};

const findSiteByDomainAnyStatus = async (domain) => {
  const host = String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (!host) return null;
  return prisma.site.findFirst({
    where: { customDomain: host },
    include: siteInclude,
  });
};

/** Sites the user owns or is a member of */
const findSitesForUser = async (userId) => {
  return prisma.site.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: siteInclude,
    orderBy: { createdAt: 'desc' },
  });
};

const updateSite = async (id, data) => {
  return prisma.site.update({
    where: { id: Number(id) },
    data,
    include: siteInclude,
  });
};

const deleteSite = async (id) => {
  return prisma.site.delete({
    where: { id: Number(id) },
  });
};

const findMembership = async (siteId, userId) => {
  return prisma.siteMember.findUnique({
    where: {
      siteId_userId: {
        siteId: Number(siteId),
        userId: Number(userId),
      },
    },
  });
};

const listMembers = async (siteId) => {
  return prisma.siteMember.findMany({
    where: { siteId: Number(siteId) },
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

const createMembership = async ({ siteId, userId, role }) => {
  return prisma.siteMember.create({
    data: {
      siteId: Number(siteId),
      userId: Number(userId),
      role,
    },
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
  });
};

const updateMembershipRole = async (siteId, userId, role) => {
  return prisma.siteMember.update({
    where: {
      siteId_userId: {
        siteId: Number(siteId),
        userId: Number(userId),
      },
    },
    data: { role },
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, email: true, name: true, avatar: true },
      },
    },
  });
};

const deleteMembership = async (siteId, userId) => {
  return prisma.siteMember.delete({
    where: {
      siteId_userId: {
        siteId: Number(siteId),
        userId: Number(userId),
      },
    },
  });
};

const findUserByEmail = async (email) => {
  const normalized = String(email).trim().toLowerCase();
  // Case-insensitive match (users may have mixed-case emails historically)
  return prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: 'insensitive' },
    },
    select: { id: true, email: true, name: true, avatar: true },
  });
};

const listPendingInvites = async (siteId) => {
  return prisma.siteInvite.findMany({
    where: {
      siteId: Number(siteId),
      status: 'pending',
    },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: true,
      inviter: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findPendingInviteBySiteEmail = async (siteId, email) => {
  return prisma.siteInvite.findFirst({
    where: {
      siteId: Number(siteId),
      email: String(email).trim().toLowerCase(),
      status: 'pending',
    },
  });
};

const createInvite = async ({ siteId, email, role, token, invitedBy, expiresAt }) => {
  return prisma.siteInvite.create({
    data: {
      siteId: Number(siteId),
      email: String(email).trim().toLowerCase(),
      role,
      token,
      invitedBy: Number(invitedBy),
      expiresAt,
      status: 'pending',
    },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: true,
    },
  });
};

const findInviteByToken = async (token) => {
  return prisma.siteInvite.findUnique({
    where: { token: String(token) },
    include: {
      site: {
        select: { id: true, name: true, slug: true, status: true, logo: true },
      },
      inviter: {
        select: { id: true, email: true, name: true },
      },
    },
  });
};

const updateInvite = async (id, data) => {
  return prisma.siteInvite.update({
    where: { id: Number(id) },
    data,
  });
};

const revokeInvite = async (id) => {
  return prisma.siteInvite.update({
    where: { id: Number(id) },
    data: { status: 'revoked' },
  });
};

module.exports = {
  createSite,
  findSiteById,
  findSiteBySlug,
  findSiteByDomain,
  findSiteByDomainAnyStatus,
  findSitesForUser,
  updateSite,
  deleteSite,
  findMembership,
  listMembers,
  createMembership,
  updateMembershipRole,
  deleteMembership,
  findUserByEmail,
  listPendingInvites,
  findPendingInviteBySiteEmail,
  createInvite,
  findInviteByToken,
  updateInvite,
  revokeInvite,
};
