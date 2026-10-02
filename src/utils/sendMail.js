const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const sender = {
  name: "Yappa Yappa",
  email: process.env.BREVO_SENDER_EMAIL,
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const emailLayout = ({ preheader, eyebrow, title, body, footer }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f8f7fc;color:#181124;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f7fc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 18px;color:#6366f1;font-size:18px;font-weight:700;letter-spacing:-0.4px;">
                Yappa Yappa
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #e7e3f2;border-radius:24px;padding:40px 36px;box-shadow:0 12px 35px rgba(24,17,36,0.08);">
                <p style="margin:0 0 12px;color:#6366f1;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                  ${escapeHtml(eyebrow)}
                </p>
                <h1 style="margin:0;color:#181124;font-size:30px;line-height:1.2;letter-spacing:-0.8px;">
                  ${escapeHtml(title)}
                </h1>
                <div style="margin-top:24px;color:#6b5e7d;font-size:16px;line-height:1.7;">
                  ${body}
                </div>
                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eeeaf5;color:#a89cb8;font-size:12px;line-height:1.6;">
                  ${escapeHtml(footer)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;color:#a89cb8;font-size:12px;line-height:1.6;text-align:center;">
                You’re receiving this email because of an activity on your Yappa Yappa account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const sendEmail = async ({ email, subject, htmlContent, textContent }) => {
  await brevo.transactionalEmails.sendTransacEmail({
    subject,
    htmlContent,
    textContent,
    sender,
    to: [{ email }],
  });
};

const sendOtp = async (email, otp) => {
  const safeOtp = escapeHtml(otp);

  await sendEmail({
    email,
    subject: "Your Yappa verification code",
    textContent: `Your Yappa verification code is ${otp}. It expires in 5 minutes.`,
    htmlContent: emailLayout({
      preheader: "Your Yappa verification code is ready.",
      eyebrow: "Email verification",
      title: "Ready to start yapping?",
      body: `
        <p style="margin:0 0 20px;">Use the code below to verify your email and finish setting up your account.</p>
        <div style="margin:24px 0;padding:18px 20px;background:#f4f3ff;border:1px solid #e1d7f5;border-radius:16px;color:#4f46e5;font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;">
          ${safeOtp}
        </div>
        <p style="margin:0;">This code expires in <strong style="color:#181124;">5 minutes</strong>.</p>
      `,
      footer: "If you didn’t request this code, you can safely ignore this email.",
    }),
  });
};

const sendResetLink = async (email, resetLink) => {
  const safeResetLink = escapeHtml(resetLink);

  await sendEmail({
    email,
    subject: "Reset your Yappa password",
    textContent: `Reset your Yappa password using this link: ${resetLink}. This link expires in 30 minutes.`,
    htmlContent: emailLayout({
      preheader: "Reset your Yappa password securely.",
      eyebrow: "Password reset",
      title: "Let’s get you back in",
      body: `
        <p style="margin:0 0 24px;">We received a request to reset your Yappa password. Use the button below to choose a new one.</p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${safeResetLink}" style="display:inline-block;background:#6366f1;border-radius:12px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;">
            Reset password
          </a>
        </p>
        <p style="margin:0;font-size:13px;">This link expires in <strong style="color:#181124;">30 minutes</strong>. If the button does not work, copy and paste this link into your browser:</p>
        <p style="margin:10px 0 0;word-break:break-all;font-size:13px;"><a href="${safeResetLink}" style="color:#6366f1;">${safeResetLink}</a></p>
      `,
      footer: "If you didn’t request a password reset, you can safely ignore this email.",
    }),
  });
};

module.exports = { sendOtp, sendResetLink };
