const nodemailer = require('nodemailer');

/**
 * Resolve SMTP config from env (EMAIL_* and SMTP_* both supported).
 */
function getSmtpConfig() {
  const host = (
    process.env.EMAIL_HOST ||
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    ''
  ).trim();
  const port = parseInt(
    process.env.EMAIL_PORT ||
      process.env.SMTP_PORT ||
      process.env.MAIL_PORT ||
      '587',
    10
  );
  const user = (
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    ''
  ).trim();
  const pass = (
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    ''
  ).trim();
  const from =
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    (user ? `CoreHead <${user}>` : 'CoreHead <noreply@corehead.local>');
  const secure =
    String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '')
      .toLowerCase() === 'true' || port === 465;

  return { host, port, user, pass, from, secure };
}

function hasRealSmtp() {
  const cfg = getSmtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass);
}

let cachedTransporter = null;
let transportMode = null; // 'smtp' | 'ethereal' | 'console'

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const cfg = getSmtpConfig();

  // 1) Real SMTP only when fully configured
  if (cfg.host && cfg.user && cfg.pass) {
    cachedTransporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port || 587,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    transportMode = 'smtp';
    console.log(`[email] Real SMTP: ${cfg.host}:${cfg.port} as ${cfg.user}`);
    return cachedTransporter;
  }

  console.warn(
    '[email] Real SMTP not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS (or SMTP_*).'
  );
  console.warn(
    '[email] Without SMTP, mail is NOT delivered to real inboxes.'
  );

  // 2) Ethereal = fake inbox for developers only (not real delivery)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transportMode = 'ethereal';
      console.log('[email] Dev mode: Ethereal test SMTP (preview only).');
      console.log(`[email] Ethereal user: ${testAccount.user}`);
      return cachedTransporter;
    } catch (err) {
      console.warn('[email] Ethereal failed:', err.message);
    }
  }

  // 3) Console only
  cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
  transportMode = 'console';
  console.warn('[email] Console transport — email body logged, not sent.');
  return cachedTransporter;
}

/**
 * Send email.
 * - sent: true  ONLY when real SMTP accepted the message
 * - sent: false for ethereal/console (dev) — previewUrl may still be set
 */
const sendEmail = async (options) => {
  const cfg = getSmtpConfig();
  const to = options.to;
  const subject = options.subject || '(no subject)';

  if (!to) {
    return { sent: false, error: 'No recipient', provider: null };
  }

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text: options.text || '',
      html: options.html || options.text || '',
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    const mode = transportMode || 'unknown';

    if (previewUrl) {
      console.log(`[email] DEV preview (not a real inbox): ${previewUrl}`);
    }

    if (mode === 'console' && info.message) {
      console.log('[email] (console dump) To:', to, '| Subject:', subject);
      console.log(String(info.message).slice(0, 800));
    }

    // ONLY real SMTP counts as delivered to the recipient's mailbox
    if (mode === 'smtp') {
      console.log(
        `[email] DELIVERED via SMTP to ${to} — ${subject} (id: ${info.messageId})`
      );
      return {
        sent: true,
        realDelivery: true,
        messageId: info.messageId || null,
        previewUrl: null,
        provider: 'smtp',
      };
    }

    // Ethereal / console — success for transport, but NOT real delivery
    console.log(
      `[email] NOT real delivery (provider=${mode}) to ${to} — ${subject}`
    );
    return {
      sent: false,
      realDelivery: false,
      messageId: info.messageId || null,
      previewUrl,
      provider: mode,
      error:
        mode === 'ethereal'
          ? 'Dev mode: email went to Ethereal test inbox, not the real address. Configure EMAIL_HOST/EMAIL_USER/EMAIL_PASS for real delivery.'
          : 'Email not sent: SMTP is not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in backend .env',
    };
  } catch (err) {
    console.error('[email] Send failed:', err.message);
    // Clear cache so next send can retry with fixed config
    cachedTransporter = null;
    transportMode = null;
    return {
      sent: false,
      realDelivery: false,
      error: err.message || 'Email send failed',
      provider: transportMode,
    };
  }
};

/** Reset transporter (e.g. after .env change) */
const resetEmailTransport = () => {
  cachedTransporter = null;
  transportMode = null;
};

module.exports = {
  sendEmail,
  getSmtpConfig,
  hasRealSmtp,
  resetEmailTransport,
};
