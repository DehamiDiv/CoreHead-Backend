const assert = require('node:assert/strict');
const test = require('node:test');

const { createEmailService, readEmailConfig } = require('../src/services/emailService');

function createLogger() {
    return { info() {}, error() {} };
}

test('readEmailConfig trims Resend configuration', () => {
    assert.deepEqual(
        readEmailConfig({
            RESEND_API_KEY: ' re_test_key ',
            EMAIL_FROM: ' CoreHead <no-reply@example.com> ',
        }),
        {
            apiKey: 're_test_key',
            from: 'CoreHead <no-reply@example.com>',
        },
    );
});

test('sendEmail fails quickly when Resend configuration is missing', async () => {
    let clientCreated = false;
    const service = createEmailService({
        env: {},
        createClient: () => {
            clientCreated = true;
            return {};
        },
        logger: createLogger(),
    });

    const result = await service.sendEmail({
        to: 'reader@example.com',
        subject: 'Verify email',
        text: '123456',
    });

    assert.equal(clientCreated, false);
    assert.equal(result.sent, false);
    assert.equal(result.provider, 'resend');
    assert.match(result.error, /RESEND_API_KEY, EMAIL_FROM/);
});

test('sendEmail sends through Resend and preserves the shared result contract', async () => {
    let receivedApiKey;
    let receivedMessage;
    const service = createEmailService({
        env: {
            RESEND_API_KEY: 're_test_key',
            EMAIL_FROM: 'CoreHead CMS <no-reply@example.com>',
        },
        createClient: (apiKey) => {
            receivedApiKey = apiKey;
            return {
                emails: {
                    send: async (message) => {
                        receivedMessage = message;
                        return { data: { id: 'email_123' }, error: null };
                    },
                },
            };
        },
        logger: createLogger(),
    });

    const result = await service.sendEmail({
        to: 'reader@example.com',
        subject: 'Verify email',
        text: 'Code: 123456',
        html: '<strong>123456</strong>',
    });

    assert.equal(receivedApiKey, 're_test_key');
    assert.deepEqual(receivedMessage, {
        from: 'CoreHead CMS <no-reply@example.com>',
        to: 'reader@example.com',
        subject: 'Verify email',
        text: 'Code: 123456',
        html: '<strong>123456</strong>',
    });
    assert.deepEqual(result, {
        sent: true,
        realDelivery: true,
        messageId: 'email_123',
        provider: 'resend',
    });
});

test('sendEmail returns a structured failure when Resend rejects a request', async () => {
    const service = createEmailService({
        env: {
            RESEND_API_KEY: 're_test_key',
            EMAIL_FROM: 'CoreHead CMS <no-reply@example.com>',
        },
        createClient: () => ({
            emails: {
                send: async () => ({
                    data: null,
                    error: { message: 'The example.com domain is not verified.' },
                }),
            },
        }),
        logger: createLogger(),
    });

    const result = await service.sendEmail({
        to: 'reader@example.com',
        subject: 'Verify email',
    });

    assert.equal(result.sent, false);
    assert.equal(result.realDelivery, false);
    assert.equal(result.provider, 'resend');
    assert.match(result.error, /not verified/);
});

test('sendEmail converts Resend transport exceptions into a structured failure', async () => {
    const service = createEmailService({
        env: {
            RESEND_API_KEY: 're_test_key',
            EMAIL_FROM: 'CoreHead CMS <no-reply@example.com>',
        },
        createClient: () => ({
            emails: {
                send: async () => {
                    throw new Error('request timeout');
                },
            },
        }),
        logger: createLogger(),
    });

    const result = await service.sendEmail({
        to: 'reader@example.com',
        subject: 'Verify email',
    });

    assert.deepEqual(result, {
        sent: false,
        realDelivery: false,
        error: 'request timeout',
        provider: 'resend',
    });
});
