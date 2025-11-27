import { getApiSession } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { StudentStatus, VerificationStatus } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/verifications
 * Get all students pending verification (alumni)
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get('status') || 'PENDING';
    const status = rawStatus.trim().toUpperCase();

    const whereClause: {
      student_status: StudentStatus;
      verification_status?: VerificationStatus;
    } = { student_status: StudentStatus.ALUMNI };

    if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      whereClause.verification_status = status as VerificationStatus;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        account: { select: { email: true, created_at: true } },
        verifiedByAdmin: { select: { username: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      student_id: student.student_id,
      name: DOMPurify.sanitize(student.name),
      email: student.account?.email || '',
      faculty: student.faculty,
      year: student.year,
      verification_status: student.verification_status,
      email_verified: student.email_verified,
      transcript: student.transcript,
      verified_by: student.verifiedByAdmin?.username
        ? DOMPurify.sanitize(student.verifiedByAdmin.username)
        : undefined,
      verified_at: student.verified_at,
      created_at: student.created_at,
      account_created_at: student.account?.created_at,
    }));

    return NextResponse.json(
      { students: formattedStudents, total: formattedStudents.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
