import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  isValidKUEmail,
  generateVerificationCode,
  getVerificationExpiry,
} from '@/lib/email-validation';
import { sendVerificationEmail } from '@/lib/email';

// Rate limiting: Track last email sent time per email address
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60000; // 1 minute

/**
 * POST /api/students/send-verification
 * Send a verification email to a student's KU email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, studentName } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if the student is an alumni
    const student = await prisma.student.findFirst({
      where: {
        account: {
          email: email
        }
      },
      select: {
        student_status: true
      }
    });

    // Only require KU email for current students, alumni can use any email
    if (student?.student_status === 'CURRENT' && !isValidKUEmail(email)) {
      return NextResponse.json(
        { error: 'Current students must use a valid KU email address (@ku.th)' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const normalizedEmail = email.toLowerCase().trim();
    const lastSentTime = rateLimitMap.get(normalizedEmail);
    const now = Date.now();

    if (lastSentTime && now - lastSentTime < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastSentTime)) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Please wait ${remainingSeconds} seconds before requesting another code`,
        },
        { status: 429 }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiryDate = getVerificationExpiry();

    // Delete any existing verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Save token to database
    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        token: verificationCode,
        expires: expiryDate,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, studentName);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Clean up the token if email fails
      await prisma.emailVerificationToken.deleteMany({
        where: { email: normalizedEmail, token: verificationCode },
      });

      return NextResponse.json(
        {
          error: 'Failed to send verification email',
          message: 'Please try again later or contact support',
        },
        { status: 500 }
      );
    }

    // Update rate limit tracker
    rateLimitMap.set(normalizedEmail, now);

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: '15 minutes',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send-verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
