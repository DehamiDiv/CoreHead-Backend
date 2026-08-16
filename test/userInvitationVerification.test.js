const assert = require('node:assert/strict');
const test = require('node:test');

const {
  provisionInvitedUser,
} = require('../src/controllers/userController');

test('administrator-created user remains unverified and receives an OTP', async () => {
  let createData;
  let verificationEmail;
  const prismaClient = {
    user: {
      findUnique: async () => null,
      create: async ({ data }) => {
        createData = data;
        return { id: 41, ...data };
      },
    },
  };
  const bcryptLib = {
    genSalt: async () => 'salt',
    hash: async () => 'hashed-password',
  };
  const verificationService = {
    resendVerificationOtp: async (email) => {
      verificationEmail = email;
      return {
        emailResult: {
          sent: true,
          realDelivery: true,
          provider: 'resend',
          messageId: 'email_123',
        },
      };
    },
  };

  const result = await provisionInvitedUser(
    {
      email: ' New.Member@Example.com ',
      password: 'Admin@1234',
      role: 'Editor',
      name: 'New Member',
    },
    { prismaClient, bcryptLib, verificationService },
  );

  assert.equal(createData.email, 'new.member@example.com');
  assert.equal(createData.password, 'hashed-password');
  assert.equal(createData.isEmailVerified, false);
  assert.equal(createData.status, 'active');
  assert.equal(createData.provider, 'local');
  assert.equal(verificationEmail, 'new.member@example.com');
  assert.equal(result.emailResult.sent, true);
  assert.equal(result.emailResult.provider, 'resend');
});

test('administrator-created user rejects an existing normalized email', async () => {
  let created = false;
  const prismaClient = {
    user: {
      findUnique: async ({ where }) => ({ id: 7, email: where.email }),
      create: async () => {
        created = true;
      },
    },
  };

  await assert.rejects(
    provisionInvitedUser(
      { email: ' Existing@Example.com ', password: 'Admin@1234' },
      {
        prismaClient,
        bcryptLib: {},
        verificationService: {},
      },
    ),
    (error) => error.statusCode === 400 && /already exists/.test(error.message),
  );
  assert.equal(created, false);
});
