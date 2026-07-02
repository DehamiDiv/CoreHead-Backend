const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    // For development, you can use Mailtrap or Gmail.
    // For now, I'll use placeholders. You can update these in .env
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Define email options
    const mailOptions = {
        from: 'CoreHead <noreply@corehead.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    // 3. Send email
    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmail
};
