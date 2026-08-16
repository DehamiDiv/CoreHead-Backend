const prisma = require('../models/prismaClient');
const emailService = require('../services/emailService');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'This email is already subscribed!' });
    }

    await prisma.newsletterSubscription.create({
      data: { email },
    });

    // Send a welcome email notification
    await emailService.sendEmail({
      to: email,
      subject: 'Welcome to CoreHead Newsletter!',
      text: `Hi,\n\nThank you for subscribing to the CoreHead newsletter. We will keep you updated with the latest news, low-code blog builder tutorials, and premium templates!\n\nBest regards,\nThe CoreHead Team`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
               <h2 style="color: #2563eb; margin-top: 0;">Welcome to CoreHead!</h2>
               <p>Hi,</p>
               <p>Thank you for subscribing to the <strong>CoreHead</strong> newsletter. We are excited to have you on board!</p>
               <p>We will keep you updated with the latest news, builder features, and design guides.</p>
               <br />
               <p>Best regards,</p>
               <p><strong>The CoreHead Team</strong></p>
             </div>`
    });

    return res.status(200).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while subscribing.' });
  }
};
