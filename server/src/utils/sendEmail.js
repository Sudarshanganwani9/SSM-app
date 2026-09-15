const nodemailer = require('nodemailer');

let transporter = null;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transporter;
}

/**
 * Sends an email if SMTP is configured. Otherwise, falls back to a
 * dev-safe console log so nothing silently breaks in local development -
 * this is documented in the README as the "development-safe mechanism"
 * requested for environments without email infra configured yet.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!isSmtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`\n[dev-mailer] SMTP not configured - would have sent email:`);
    console.log(`[dev-mailer] To: ${to}`);
    console.log(`[dev-mailer] Subject: ${subject}`);
    console.log(`[dev-mailer] Body: ${text || html}\n`);
    return { devMode: true };
  }

  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"SSM HR" <no-reply@ssm.local>`,
    to,
    subject,
    html,
    text,
  });
  return { devMode: false, messageId: info.messageId };
}

module.exports = { sendEmail, isSmtpConfigured };
