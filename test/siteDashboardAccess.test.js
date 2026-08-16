const assert = require('node:assert/strict');
const test = require('node:test');

const repositoryPath = require.resolve('../src/repositories/siteRepository');
const servicePath = require.resolve('../src/services/siteService');
const prismaPath = require.resolve('../src/models/prismaClient');
const emailPath = require.resolve('../src/services/emailService');

const site = { id: 17, name: 'Tenant site', slug: 'tenant-site', ownerId: 10 };
let membership = null;
let sitesForUser = [];

require.cache[repositoryPath] = {
  id: repositoryPath,
  filename: repositoryPath,
  loaded: true,
  exports: {
    async findSiteById(id) {
      return Number(id) === site.id ? site : null;
    },
    async findMembership(siteId, userId) {
      if (Number(siteId) !== site.id || !membership) return null;
      return Number(userId) === membership.userId ? membership : null;
    },
    async findSitesForUser() {
      return sitesForUser;
    },
    async updateSite(id, data) {
      return { ...site, id: Number(id), ...data };
    },
  },
};
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: {},
};
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {},
};
delete require.cache[servicePath];

const siteService = require('../src/services/siteService');

test.beforeEach(() => {
  membership = null;
  sitesForUser = [];
});

test('site list exposes OWNER for the site owner', async () => {
  sitesForUser = [{ ...site, members: [] }];

  const [result] = await siteService.listMySites(site.ownerId);

  assert.equal(result.siteRole, 'OWNER');
});

test('site list exposes the selected-site membership role', async () => {
  sitesForUser = [{
    ...site,
    members: [{ siteId: site.id, userId: 22, role: 'EDITOR' }],
  }];

  const [result] = await siteService.listMySites(22);

  assert.equal(result.siteRole, 'EDITOR');
});

test('site owner can resolve the protected dashboard site', async () => {
  const result = await siteService.getSiteById(site.id, site.ownerId, 'user');
  assert.equal(result.id, site.id);
});

test('authorized site member can resolve the protected dashboard site', async () => {
  membership = { siteId: site.id, userId: 22, role: 'EDITOR' };
  const result = await siteService.getSiteById(site.id, 22, 'user');
  assert.equal(result.slug, site.slug);
});

test('reader without site membership cannot resolve the dashboard site', async () => {
  await assert.rejects(
    () => siteService.getSiteById(site.id, 99, 'user'),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.match(error.message, /not a member/i);
      return true;
    },
  );
});

test('site editor can update the canonical site name', async () => {
  membership = { siteId: site.id, userId: 22, role: 'EDITOR' };

  const result = await siteService.updateSite(
    site.id,
    membership.userId,
    'user',
    { name: '  Updated Tenant Site  ' },
  );

  assert.equal(result.name, 'Updated Tenant Site');
  assert.equal(result.slug, site.slug);
});

test('site editor cannot change the public slug', async () => {
  membership = { siteId: site.id, userId: 22, role: 'EDITOR' };

  await assert.rejects(
    () => siteService.updateSite(site.id, membership.userId, 'user', { slug: 'new-slug' }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.match(error.message, /only the site owner/i);
      return true;
    },
  );
});

test('non-member cannot update the canonical site name', async () => {
  await assert.rejects(
    () => siteService.updateSite(site.id, 99, 'user', { name: 'Unauthorized Name' }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.match(error.message, /not a member/i);
      return true;
    },
  );
});
