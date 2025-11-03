import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/students/verification-status
 * Fetch the current verification status for the logged-in student
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the student's current verification status from the database
    const student = await prisma.student.findFirst({
      where: {
        account_id: parseInt(session.user.id)
      },
      select: {
        verification_status: true,
        email_verified: true,
        student_status: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verificationStatus: student.verification_status,
      emailVerified: student.email_verified,
      studentStatus: student.student_status
    });

  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
