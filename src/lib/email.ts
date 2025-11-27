/**
 * Email Service
 * Handles sending emails using SMTP (Gmail)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Track recent emails to prevent duplicates (in-memory cache)
 * Key: email+subject hash, Value: timestamp
 */
const recentEmails = new Map<string, number>();

/**
 * Send an email using SMTP or Console Logging
 * Priority: SMTP → Console Logging
 * @param options - Email options (to, subject, html, text)
 * @returns Promise that resolves when email is sent
 */
import { escapeHtml } from './htmlEscape';

export async function sendEmail(options: EmailOptions): Promise<void> {
  const emailKey = `${options.to}:${options.subject}`;
  const now = Date.now();
  const lastSent = recentEmails.get(emailKey);

  if (lastSent && now - lastSent < 10000) {
    console.warn(`Duplicate email prevented: ${options.subject} to ${options.to} (sent ${Math.round((now - lastSent) / 1000)}s ago)`);
    return;
  }

  recentEmails.set(emailKey, now);

  for (const [key, timestamp] of recentEmails.entries()) {
    if (now - timestamp > 30000) recentEmails.delete(key);
  }

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `CPSK Job Connect <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Email sent via SMTP to ${options.to}`);
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80));
      console.log('EMAIL (Development Mode - Not Actually Sent)');
      console.log('='.repeat(80));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('-'.repeat(80));
      console.log(options.text || 'No text content');
      console.log('='.repeat(80) + '\n');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    const detail = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(`Failed to send email${detail}`);
  }
}

/**
 * Generate HTML template for verification email
 * @param code - 6-digit verification code
 * @param recipientName - Name of the recipient
 * @returns HTML string
 */
export function generateVerificationEmailHTML(code: string, recipientName?: string): string {
  const safeRecipient = escapeHtml(recipientName);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f4f4f4;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      color: #2c5aa0;
      margin-bottom: 20px;
    }
    .code-container {
      background-color: white;
      border: 2px dashed #2c5aa0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #2c5aa0;
      letter-spacing: 5px;
      font-family: 'Courier New', monospace;
    }
    .info {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">🎓 CPSK Job Connect</h1>

    ${recipientName ? `<p>Hello ${safeRecipient},</p>` : '<p>Hello,</p>'}

    <p>Thank you for registering with CPSK Job Connect. To complete your registration and verify your KU email address, please use the verification code below:</p>

    <div class="code-container">
      <div class="code">${code}</div>
    </div>

    <div class="info">
      ⏰ <strong>Important:</strong> This code will expire in 15 minutes.
    </div>

    <p>If you didn't request this verification code, please ignore this email.</p>

    <div class="footer">
      <p>CPSK Job Connect - Kasetsart University</p>
      <p>Connecting KU students with career opportunities</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of verification email
 * @param code - 6-digit verification code
 * @param recipientName - Name of the recipient
 * @returns Plain text string
 */
export function generateVerificationEmailText(code: string, recipientName?: string): string {
  const safeRecipientText = escapeHtml(recipientName);

  return `
CPSK Job Connect - Email Verification

${recipientName ? `Hello ${safeRecipientText},` : 'Hello,'}

Thank you for registering with CPSK Job Connect. To complete your registration and verify your KU email address, please use the verification code below:

Verification Code: ${code}

IMPORTANT: This code will expire in 15 minutes.

If you didn't request this verification code, please ignore this email.

---
CPSK Job Connect - Kasetsart University
Connecting KU students with career opportunities
  `.trim();
}

/**
 * Send verification email to a student
 * @param email - Student's email address
 * @param code - 6-digit verification code
 * @param studentName - Student's name (optional)
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  studentName?: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Verify your KU email - CPSK Job Connect',
    html: generateVerificationEmailHTML(code, studentName),
    text: generateVerificationEmailText(code, studentName),
  });
}

/**
 * Generate HTML template for alumni approval notification
 */
export function generateAlumniApprovalEmailHTML(studentName: string, approved: boolean): string {
  const approvalStatus = approved ? 'Approved' : 'Rejected';
  const emoji = approved ? '✅' : '❌';
  const message = approved
    ? 'Your alumni verification has been approved! Please log in to your dashboard and click on the "Account Pending Admin Approval" badge to verify your KU email address. You can browse jobs now, but you\'ll need to complete email verification before applying.'
    : 'Unfortunately, your alumni verification has been rejected. Please contact support if you believe this is an error.';

  const safeStudent = escapeHtml(studentName);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alumni Verification ${approvalStatus}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f4f4f4;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      color: #2c5aa0;
      margin-bottom: 20px;
    }
    .status {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border: 2px solid ${approved ? '#28a745' : '#dc3545'};
    }
    .status-text {
      font-size: 24px;
      font-weight: bold;
      color: ${approved ? '#28a745' : '#dc3545'};
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .info-box {
      background-color: #e7f3ff;
      border-left: 4px solid #2c5aa0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">🎓 CPSK Job Connect</h1>

    <p>Hello ${safeStudent},</p>

    <div class="status">
      <div class="status-text">${emoji} Verification ${approvalStatus}</div>
    </div>

    <p>${message}</p>

    ${approved ? '<div class="info-box"><strong>Next Steps:</strong><br>1. Log in to your dashboard<br>2. Click on the "Account Pending Admin Approval" badge at the top<br>3. Verify your KU email to complete registration</div>' : ''}

    <div class="footer">
      <p>CPSK Job Connect - Kasetsart University</p>
      <p>Connecting KU students with career opportunities</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send alumni verification status email
 */
export async function sendAlumniStatusEmail(
  email: string,
  studentName: string,
  approved: boolean,
  notes?: string
): Promise<void> {
  const approvalStatus = approved ? 'Approved' : 'Rejected';

  const safeStudent = escapeHtml(studentName);
  const safeNotes = notes ? escapeHtml(notes) : undefined;

  let textContent = `
CPSK Job Connect - Alumni Verification ${approvalStatus}

Hello ${safeStudent},

Your alumni verification has been ${approved ? 'approved' : 'rejected'}.
`;

  if (safeNotes) {
    textContent += `\n\nAdmin notes: ${safeNotes}`;
  }

  if (approved) {
    textContent += '\n\nTo complete your registration, please verify your KU email address. You will receive a separate email with a 6-digit verification code.';
  }

  await sendEmail({
    to: email,
    subject: `Alumni Verification ${approvalStatus} - CPSK Job Connect`,
    html: generateAlumniApprovalEmailHTML(studentName, approved),
    text: textContent.trim(),
  });
}

/**
 * Generate HTML template for company approval notification
 */
export function generateCompanyApprovalEmailHTML(companyName: string, approved: boolean, notes?: string): string {
  const approvalStatus = approved ? 'Approved' : 'Rejected';
  const emoji = approved ? '✅' : '❌';
  const safeCompany = escapeHtml(companyName);
  const safeNotes = notes ? escapeHtml(notes) : undefined;
  const message = approved
    ? 'Your company registration has been approved! You can now post job openings and manage applications.'
    : `Unfortunately, your company registration has been rejected.${safeNotes ? ` Reason: ${safeNotes}` : ' Please contact support if you believe this is an error.'}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let dashboardHref = '';
  try {
    dashboardHref = new URL('/company/dashboard', baseUrl).toString();
  } catch (e) {
    dashboardHref = baseUrl + '/company/dashboard';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Company Registration ${approvalStatus}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f4f4f4;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      color: #2c5aa0;
      margin-bottom: 20px;
    }
    .status {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border: 2px solid ${approved ? '#28a745' : '#dc3545'};
    }
    .status-text {
      font-size: 24px;
      font-weight: bold;
      color: ${approved ? '#28a745' : '#dc3545'};
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2c5aa0;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">🏢 CPSK Job Connect</h1>

    <p>Hello ${safeCompany},</p>

    <div class="status">
      <div class="status-text">${emoji} Registration ${approvalStatus}</div>
    </div>

    <p>${message}</p>

    ${approved ? '<a href="' + dashboardHref + '" class="button">Go to Dashboard</a>' : ''}

    <div class="footer">
      <p>CPSK Job Connect - Kasetsart University</p>
      <p>Connecting KU students with career opportunities</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send company registration status email
 */
export async function sendCompanyStatusEmail(
  email: string,
  companyName: string,
  approved: boolean,
  notes?: string
): Promise<void> {
  const approvalStatus = approved ? 'Approved' : 'Rejected';

const safeCompany = escapeHtml(companyName);
  const safeNotes = notes ? escapeHtml(notes) : undefined;

  let textContent = `
CPSK Job Connect - Company Registration ${approvalStatus}

Hello ${safeCompany},

Your company registration has been ${approved ? 'approved' : 'rejected'}.
`;

  if (safeNotes) {
    textContent += `\n\nAdmin notes: ${safeNotes}`;
  }

  if (approved) {
    textContent += '\n\nYou can now post job openings and manage applications on CPSK Job Connect.';
  }

  await sendEmail({
    to: email,
    subject: `Company Registration ${approvalStatus} - CPSK Job Connect`,
    html: generateCompanyApprovalEmailHTML(companyName, approved, notes),
    text: textContent.trim(),
  });
}

/**
 * Send alumni registration confirmation email
 */
export async function sendAlumniRegistrationEmail(
  email: string,
  studentName: string
): Promise<void> {
  const safeStudent = escapeHtml(studentName);
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Received - CPSK Job Connect</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f4f4f4;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      color: #2c5aa0;
      margin-bottom: 20px;
    }
    .status {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border: 2px solid #2c5aa0;
    }
    .status-text {
      font-size: 24px;
      font-weight: bold;
      color: #2c5aa0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">🎓 CPSK Job Connect</h1>

    <p>Hello ${safeStudent},</p>

    <div class="status">
      <div class="status-text">📝 Registration Received</div>
    </div>

    <p>Thank you for registering with CPSK Job Connect as an alumni!</p>

    <div class="info-box">
      <strong>⏳ What happens next?</strong><br><br>
      1. Our admin team will review your transcript<br>
      2. You'll receive an email once your application is reviewed<br>
      3. If approved, you'll need to verify your email to complete registration<br>
      4. Once verified, you can start applying for jobs!
    </div>

    <p><strong>In the meantime:</strong></p>
    <ul>
      <li>You can log in and browse available job opportunities</li>
      <li>Applications will be enabled once your account is approved and verified</li>
    </ul>

    <p>We typically review applications within 1-2 business days.</p>

    <div class="footer">
      <p>CPSK Job Connect - Kasetsart University</p>
      <p>Connecting KU students with career opportunities</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
CPSK Job Connect - Alumni Registration Received

Hello ${safeStudent},

Thank you for registering with CPSK Job Connect as an alumni!

What happens next?
1. Our admin team will review your transcript
2. You'll receive an email once your application is reviewed
3. If approved, you'll need to verify your email to complete registration
4. Once verified, you can start applying for jobs!

In the meantime:
- You can log in and browse available job opportunities
- Applications will be enabled once your account is approved and verified

We typically review applications within 1-2 business days.

---
CPSK Job Connect - Kasetsart University
Connecting KU students with career opportunities
  `.trim();

  await sendEmail({
    to: email,
    subject: 'Alumni Registration Received - CPSK Job Connect',
    html,
    text: textContent,
  });
}

type PasswordResetEmailOptions = {
  email: string;
  name?: string;
  resetLink: string;
  expiresMinutes?: number;
};

export async function sendPasswordResetEmail({
  email,
  name,
  resetLink,
  expiresMinutes = 15,
}: PasswordResetEmailOptions) {
  const safeName = name || "there";
  const primary = "#1C4E80";
  const accent = "#0F9D58";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Requested</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #f5f7fb;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1f2937;
    }
    .email-wrapper {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e4e8f5;
      box-shadow: 0 15px 30px rgba(28, 78, 128, 0.08);
      overflow: hidden;
    }
    .banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 32px;
      background: #f2f6ff;
      border-bottom: 1px solid #d9e4ff;
    }
    .banner-icon {
      font-size: 32px;
    }
    .banner h1 {
      font-size: 22px;
      margin: 0;
      color: ${primary};
    }
    .content {
      padding: 32px;
      line-height: 1.6;
    }
    .cta {
      display: inline-block;
      padding: 12px 28px;
      margin: 24px 0;
      border-radius: 50px;
      background: ${primary};
      color: white !important;
      font-weight: 600;
      text-decoration: none;
    }
    .cta:hover {
      background: #163a60;
    }
    .info-box {
      margin-top: 24px;
      padding: 16px;
      border-radius: 12px;
      background: #fdf7e7;
      border: 1px solid #f4d38c;
      font-size: 14px;
      color: #775520;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding: 20px 32px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background: #fafbfd;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="banner">
      <span class="banner-icon">🔐</span>
      <div>
        <h1>Password Reset Requested</h1>
        <p style="margin: 2px 0 0; color: #4b5563;">CPSK Job Connect</p>
      </div>
    </div>
    <div class="content">
      <p>Hello ${safeName},</p>
      <p>We received a request to reset the password for your CPSK Job Connect account. Click the button below to create a new password.</p>
      <p><strong>Security notice:</strong> this link expires in ${expiresMinutes} minutes.</p>
      <p style="text-align:center;">
        <a href="${resetLink}" class="cta">Reset Password</a>
      </p>
      <div class="info-box">
        If you didn&apos;t request this change, you can safely ignore this email. Your current password will remain active unless you follow the link above.
      </div>
    </div>
    <div class="footer">
      CPSK Job Connect · Kasetsart University<br />
      Connecting KU talents with career opportunities
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Password Reset Requested

Hello ${safeName},

We received a request to reset your CPSK Job Connect password.
Use the link below to create a new password. This link expires in ${expiresMinutes} minutes.

${resetLink}

If you didn't request this, you can safely ignore this email.
  `.trim();

  await sendEmail({
    to: email,
    subject: "Reset your CPSK Job Connect password",
    html,
    text,
  });
}

