/**
 * Email Service
 * Handles sending emails using Resend
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Initialize Resend client
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param options - Email options (to, subject, html, text)
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      throw new Error('Email service is not configured');
    }

    await resend.emails.send({
      from: 'CPSK Job Connect <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Generate HTML template for verification email
 * @param code - 6-digit verification code
 * @param recipientName - Name of the recipient
 * @returns HTML string
 */
export function generateVerificationEmailHTML(code: string, recipientName?: string): string {
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

    ${recipientName ? `<p>Hello ${recipientName},</p>` : '<p>Hello,</p>'}

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
  return `
CPSK Job Connect - Email Verification

${recipientName ? `Hello ${recipientName},` : 'Hello,'}

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
  const status = approved ? 'Approved' : 'Rejected';
  const emoji = approved ? '✅' : '❌';
  const message = approved
    ? 'Your alumni verification has been approved! You can now browse and apply for jobs on CPSK Job Connect.'
    : 'Unfortunately, your alumni verification has been rejected. Please contact support if you believe this is an error.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alumni Verification ${status}</title>
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
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">🎓 CPSK Job Connect</h1>

    <p>Hello ${studentName},</p>

    <div class="status">
      <div class="status-text">${emoji} Verification ${status}</div>
    </div>

    <p>${message}</p>

    ${approved ? '<a href="' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/student/dashboard" class="button">Go to Dashboard</a>' : ''}

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
  const status = approved ? 'Approved' : 'Rejected';

  let textContent = `
CPSK Job Connect - Alumni Verification ${status}

Hello ${studentName},

Your alumni verification has been ${approved ? 'approved' : 'rejected'}.
`;

  if (notes) {
    textContent += `\n\nAdmin notes: ${notes}`;
  }

  if (approved) {
    textContent += '\n\nYou can now browse and apply for jobs on CPSK Job Connect.';
  }

  await sendEmail({
    to: email,
    subject: `Alumni Verification ${status} - CPSK Job Connect`,
    html: generateAlumniApprovalEmailHTML(studentName, approved),
    text: textContent.trim(),
  });
}
