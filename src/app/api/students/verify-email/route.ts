import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isVerificationExpired } from '@/lib/email-validation';
import { getApiSession } from '@/lib/api-auth';

/**
 * POST /api/students/verify-email
 * Verify a student's email using the verification code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedToken = token.trim();

    // Find verification token in database
    const verificationToken = await prisma.email_verification_tokens.findFirst({
      where: {
        email: normalizedEmail,
        token: normalizedToken,
      },
    });

    // Check if token exists
    if (!verificationToken) {
      return NextResponse.json(
        {
          error: 'Invalid verification code',
          message: 'The code you entered is incorrect. Please try again.',
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (isVerificationExpired(verificationToken.expires)) {
      // Delete expired token
      await prisma.email_verification_tokens.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        {
          error: 'Verification code expired',
          message: 'This code has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Find the student account
    const account = await prisma.account.findUnique({
      where: { email: normalizedEmail },
      include: { student: true },
    });

    if (!account || !account.student) {
      // Delete the token
      await prisma.email_verification_tokens.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        {
          error: 'Student account not found',
          message: 'Please register first before verifying your email.',
        },
        { status: 404 }
      );
    }

    // Update student record to mark email as verified
    await prisma.student.update({
      where: { id: account.student.id },
      data: {
        email_verified: true,
        // Auto-approve current students upon email verification
        verification_status: account.student.student_status === 'CURRENT' ? 'APPROVED' : account.student.verification_status,
      },
    });

    // Delete the used verification token
    await prisma.email_verification_tokens.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: 'Email verified successfully!',
        studentStatus: account.student.student_status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in verify-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/students/verify-email
 * Check verification status for currently logged-in student
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getApiSession(req);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { student: true },
    });

    if (!account || !account.student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        emailVerified: account.student.email_verified,
        studentStatus: account.student.student_status,
        verificationStatus: account.student.verification_status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
