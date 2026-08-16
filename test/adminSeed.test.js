const assert = require('node:assert/strict');
const test = require('node:test');

const { readAdminConfig, seedAdminUser } = require('../scripts/seedAdmin');

test('admin seed requires valid environment credentials', () => {
  assert.throws(() => readAdminConfig({}), /ADMIN_EMAIL and ADMIN_PASSWORD/);
  assert.throws(
    () => readAdminConfig({ ADMIN_EMAIL: 'invalid', ADMIN_PASSWORD: 'Admin@1234' }),
    /valid email address/,
  );
  assert.throws(
    () => readAdminConfig({ ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'weak' }),
    /8-128 characters/,
  );
});

test('admin seed creates a verified active administrator', async () => {
  const calls = [];
  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }) => {
        calls.push(data);
        return { id: 1, ...data };
      },
    },
  };
  const bcryptLib = { hash: async () => 'hashed-password' };
  const config = readAdminConfig({
    ADMIN_EMAIL: ' Admin@Example.com ',
    ADMIN_PASSWORD: 'Admin@1234',
    ADMIN_NAME: 'Platform Admin',
  });

  const result = await seedAdminUser({ prisma, config, bcryptLib });

  assert.equal(result.action, 'created');
  assert.deepEqual(calls[0], {
    email: 'admin@example.com',
    password: 'hashed-password',
    name: 'Platform Admin',
    role: 'admin',
    status: 'active',
    provider: 'local',
    isEmailVerified: true,
  });
});

test('admin seed updates an existing account without rehashing a matching password', async () => {
  let updateArgs;
  let hashCalled = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 7,
        email: 'admin@example.com',
        password: 'existing-hash',
        name: 'Old Name',
        role: 'user',
      }),
      update: async (args) => {
        updateArgs = args;
        return { id: 7, email: args.where.email, ...args.data };
      },
    },
  };
  const bcryptLib = {
    compare: async () => true,
    hash: async () => {
      hashCalled = true;
      return 'new-hash';
    },
  };
  const config = readAdminConfig({
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'Admin@1234',
    ADMIN_NAME: 'Platform Admin',
  });

  const result = await seedAdminUser({ prisma, config, bcryptLib });

  assert.equal(result.action, 'updated');
  assert.equal(hashCalled, false);
  assert.equal(updateArgs.data.password, undefined);
  assert.equal(updateArgs.data.role, 'admin');
  assert.equal(updateArgs.data.status, 'active');
  assert.equal(updateArgs.data.isEmailVerified, true);
});
