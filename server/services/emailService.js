const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, otp) {
  const mailOptions = {
    from: `"Voicefluence" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your Voicefluence account',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="color:#4F46E5;font-size:24px;margin-bottom:8px;">Voicefluence</h1>
        <p style="color:#6B7280;font-size:14px;margin-bottom:24px;">Turn your voice into authority</p>
        <p style="color:#1F2937;font-size:16px;">Your verification code is:</p>
        <div style="background:#EEF2FF;border:2px solid #E0E7FF;border-radius:12px;padding:20px;text-align:center;margin:16px 0 24px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4F46E5;">${otp}</span>
        </div>
        <p style="color:#6B7280;font-size:14px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(to, otp) {
  const mailOptions = {
    from: `"Voicefluence" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Voicefluence password',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="color:#4F46E5;font-size:24px;margin-bottom:8px;">Voicefluence</h1>
        <p style="color:#6B7280;font-size:14px;margin-bottom:24px;">Password reset request</p>
        <p style="color:#1F2937;font-size:16px;">Your password reset code is:</p>
        <div style="background:#EEF2FF;border:2px solid #E0E7FF;border-radius:12px;padding:20px;text-align:center;margin:16px 0 24px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4F46E5;">${otp}</span>
        </div>
        <p style="color:#6B7280;font-size:14px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
