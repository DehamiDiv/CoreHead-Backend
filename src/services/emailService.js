/**
 * Mock Email Service for CoreHead Backend
 * Simulates path delivery & logs outbound OTPs/demor-requests.
 */

async function sendEmail({ to, subject, text, html }) {
    console.log(`[Email Service] Mock outbound dispatch:`);
    console.log(` - To: ${to}`);
    console.log(` - Subject: ${subject}`);
    console.log(` - Content: ${text || '(HTML content only)'}`);

    return {
        sent: true,
        realDelivery: false,
        previewUrl: 'https://ethereal.email/message/mock-message-id',
        provider: 'mock'
    };
}

module.exports = {
    sendEmail
};
