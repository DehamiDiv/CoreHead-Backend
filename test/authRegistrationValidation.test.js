const assert = require('node:assert/strict');
const test = require('node:test');

const {
  validateRegistrationEmail,
} = require('../src/controllers/authController');

test('signup disables unreliable SMTP probing and leaves ownership to OTP verification', async () => {
  let validationOptions;

  const error = await validateRegistrationEmail('new.member@company.org', {
    validator: async (options) => {
      validationOptions = options;
      return {
        valid: false,
        reason: 'smtp',
        validators: {
          regex: { valid: true },
          typo: { valid: true },
          disposable: { valid: true },
          mx: { valid: true },
          smtp: { valid: false, reason: 'Mailbox probe rejected.' },
        },
      };
    },
  });

  assert.equal(validationOptions.email, 'new.member@company.org');
  assert.equal(validationOptions.validateRegex, true);
  assert.equal(validationOptions.validateMx, true);
  assert.equal(validationOptions.validateTypo, true);
  assert.equal(validationOptions.validateDisposable, true);
  assert.equal(validationOptions.validateSMTP, false);
  assert.equal(error, null);
});

test('signup still rejects domains without valid MX records', async () => {
  const error = await validateRegistrationEmail('member@missing-domain.org', {
    validator: async () => ({
      valid: false,
      reason: 'mx',
      validators: {
        regex: { valid: true },
        typo: { valid: true },
        disposable: { valid: true },
        mx: { valid: false },
      },
    }),
  });

  assert.equal(error, 'The email domain does not exist or cannot receive emails.');
});
