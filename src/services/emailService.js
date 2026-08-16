const nodemailer = require('nodemailer');

// Initialize Nodemailer transporter with env configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525', 10),
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
    },
});

async function sendEmail({ to, subject, text, html }) {
    console.log(`[Email Service] Outbound dispatch triggered:`);
    console.log(` - To: ${to}`);
    console.log(` - Subject: ${subject}`);

    try {
        const info = await transporter.sendMail({
            from: `"CoreHead CMS" <${process.env.EMAIL_USER || 'no-reply@corehead.io'}>`,
            to,
            subject,
            text,
            html,
        });

        console.log(` - Status: Sent successfully! MessageId: ${info.messageId}`);
        return {
            sent: true,
            realDelivery: !process.env.EMAIL_HOST?.includes('mailtrap'),
            messageId: info.messageId,
            provider: 'nodemailer'
        };
    } catch (error) {
        console.error(` - Status: Failed to send email!`, error.message);
        return {
            sent: false,
            error: error.message,
            provider: 'nodemailer'
        };
    }
}

module.exports = {
    sendEmail
};
