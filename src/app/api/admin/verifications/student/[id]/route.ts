import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { sendAlumniStatusEmail, sendVerificationEmail } from '@/lib/email';
import { generateVerificationCode, getVerificationExpiry } from '@/lib/email-validation';
import { StudentStatus, VerificationStatus } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';

/**
 * PATCH /api/admin/verifications/student/[id]
 * Approve or reject an alumni verification
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAccount = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { accountRole: true },
    });

    if (!adminAccount || adminAccount.accountRole?.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Canonicalize student ID
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Parse and sanitize request body
    const body = await req.json();
    const rawStatus = body.status;
    const rawNotes = body.notes || '';

    const status = rawStatus?.toString().trim().toUpperCase();
    const notes = DOMPurify.sanitize(rawNotes.trim());

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { account: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.student_status !== StudentStatus.ALUMNI) {
      return NextResponse.json({ error: 'Invalid operation', message: 'Only alumni accounts require manual verification' }, { status: 400 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        verification_status: status as VerificationStatus,
        verified_by: adminAccount.id,
        verified_at: new Date(),
        verification_notes: notes || null,
      },
      include: { account: true, verifiedByAdmin: true },
    });

    try {
      await sendAlumniStatusEmail(student.account.email, DOMPurify.sanitize(student.name), status === 'APPROVED', notes);

      if (status === 'APPROVED') {
        const verificationCode = generateVerificationCode();
        await prisma.email_verification_tokens.create({
          data: {
            email: student.account.email,
            token: verificationCode,
            expires: getVerificationExpiry(),
          },
        });

        await sendVerificationEmail(student.account.email, verificationCode, DOMPurify.sanitize(student.name));
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    await prisma.notification.create({
      data: {
        account_id: student.account_id,
        sender_id: adminAccount.id,
        message:
          status === 'APPROVED'
            ? 'Your alumni verification has been approved! You can now apply for jobs.'
            : 'Your alumni verification has been rejected. Please contact support for more information.',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      student: {
        id: updatedStudent.id,
        name: DOMPurify.sanitize(updatedStudent.name),
        email: student.account.email,
        verification_status: updatedStudent.verification_status,
        verified_by: updatedStudent.verifiedByAdmin?.username,
        verified_at: updatedStudent.verified_at,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error in admin verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/verifications/student/[id]
 * Get details of a specific student verification
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAccount = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { accountRole: true },
    });

    if (!adminAccount || adminAccount.accountRole?.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        account: { select: { email: true, created_at: true } },
        verifiedByAdmin: { select: { username: true, email: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: student.id,
      student_id: student.student_id,
      name: DOMPurify.sanitize(student.name),
      email: student.account.email,
      faculty: student.faculty,
      year: student.year,
      phone: student.phone,
      student_status: student.student_status,
      verification_status: student.verification_status,
      email_verified: student.email_verified,
      transcript: student.transcript,
      verified_by: student.verifiedByAdmin?.username,
      verified_at: student.verified_at,
      verification_notes: DOMPurify.sanitize(student.verification_notes || ''),
      created_at: student.created_at,
      account_created_at: student.account.created_at,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
