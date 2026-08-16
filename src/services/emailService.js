const { Resend } = require('resend');

function readEmailConfig(env = process.env) {
    return {
        apiKey: String(env.RESEND_API_KEY || '').trim(),
        from: String(env.EMAIL_FROM || '').trim(),
    };
}

function formatProviderError(error) {
    if (!error) return 'Resend rejected the email request.';
    if (typeof error === 'string') return error;
    return error.message || error.name || 'Resend rejected the email request.';
}

function createEmailService({
    env = process.env,
    createClient = (apiKey) => new Resend(apiKey),
    logger = console,
} = {}) {
    async function sendEmail({ to, subject, text, html }) {
        const config = readEmailConfig(env);

        if (!config.apiKey || !config.from) {
            const missing = [
                !config.apiKey && 'RESEND_API_KEY',
                !config.from && 'EMAIL_FROM',
            ].filter(Boolean);
            const error = `Email provider is not configured. Missing: ${missing.join(', ')}.`;
            logger.error(`[Email Service] ${error}`);
            return { sent: false, realDelivery: false, error, provider: 'resend' };
        }

        logger.info('[Email Service] Dispatching email through Resend.');

        try {
            const client = createClient(config.apiKey);
            const { data, error: providerError } = await client.emails.send({
                from: config.from,
                to,
                subject,
                text,
                html,
            });

            if (providerError) {
                const error = formatProviderError(providerError);
                logger.error(`[Email Service] Resend rejected the email: ${error}`);
                return { sent: false, realDelivery: false, error, provider: 'resend' };
            }

            if (!data?.id) {
                const error = 'Resend returned no email identifier.';
                logger.error(`[Email Service] ${error}`);
                return { sent: false, realDelivery: false, error, provider: 'resend' };
            }

            logger.info(`[Email Service] Email accepted by Resend. MessageId: ${data.id}`);
            return {
                sent: true,
                realDelivery: true,
                messageId: data.id,
                provider: 'resend',
            };
        } catch (error) {
            const message = error?.message || 'Unexpected Resend request failure.';
            logger.error(`[Email Service] Resend request failed: ${message}`);
            return {
                sent: false,
                realDelivery: false,
                error: message,
                provider: 'resend',
            };
        }
    }

    return { sendEmail };
}

const emailService = createEmailService();

module.exports = {
    ...emailService,
    createEmailService,
    readEmailConfig,
};
