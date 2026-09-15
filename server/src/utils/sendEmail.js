const nodemailer = require('nodemailer');

let transporter = null;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
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
 * Sends via Resend's HTTP API (https://resend.com). This works on Render's
 * free tier because it's a normal HTTPS call, not an SMTP port connection
 * (Render blocks outbound SMTP ports 25/465/587 on free web services).
 *
 * IMPORTANT: without a verified domain in Resend, the sandbox sender
 * (onboarding@resend.dev) can only deliver to the email address the
 * Resend account itself was signed up with - not to arbitrary employees.
 * Verify a real domain in Resend (Domains -> Add Domain) to lift that
 * restriction and email every employee.
 */
async function sendViaResend({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM_EMAIL || 'SSM HR <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: html || `<p>${text}</p>`,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Resend API error (status ${response.status})`);
  }

  return { devMode: false, messageId: data.id };
}

/**
 * Sends an email. Priority: Resend (HTTP API, works on Render free tier)
 * > SMTP (works only on paid hosts / local dev) > dev-safe console log.
 */
async function sendEmail({ to, subject, html, text }) {
  if (isResendConfigured()) {
    return sendViaResend({ to, subject, html, text });
  }

  if (!isSmtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`\n[dev-mailer] No email provider configured - would have sent email:`);
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

module.exports = { sendEmail, isSmtpConfigured, isResendConfigured };