import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";
import { notifyAdminsAlumniReapplication } from "@/lib/notifyAdmins";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/students/reapply-verification
 * Allow rejected alumni students to re-upload transcript and reset status to PENDING
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const transcriptFile = formData.get("transcript") as File | null;

    if (!transcriptFile) {
      return NextResponse.json(
        { error: "Transcript file is required" },
        { status: 400 }
      );
    }

    // Get student record with name and student_id for notification
    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
      select: {
        id: true,
        name: true,
        student_id: true,
        student_status: true,
        verification_status: true,
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Only allow re-application if student is ALUMNI and currently REJECTED
    if (student.student_status !== "ALUMNI" || student.verification_status !== "REJECTED") {
      return NextResponse.json(
        { error: "Only rejected alumni can re-apply for verification" },
        { status: 403 }
      );
    }

    // Upload the new transcript (docTypeId: 4 for transcript)
    const transcriptDoc = await uploadDocument(
      transcriptFile,
      session.user.id,
      4
    );

    // Reset verification status to PENDING
    await prisma.student.update({
      where: { id: student.id },
      data: {
        verification_status: "PENDING",
        verified_at: null,
        verified_by: null,
        verification_notes: null,
      }
    });

    // Create notification for the student
    await prisma.notification.create({
      data: {
        account_id: parseInt(session.user.id),
        message: "Your new transcript has been uploaded successfully. Your verification request is now pending admin review."
      }
    });

    // Notify all admins about the re-application
    await notifyAdminsAlumniReapplication(
      student.name,
      student.student_id,
      parseInt(session.user.id)
    );

    return NextResponse.json({
      success: true,
      message: "Transcript uploaded successfully. Your verification is now pending admin review.",
      transcript: transcriptDoc
    });

  } catch (error) {
    console.error("Error in reapply-verification:", error);
    return NextResponse.json(
      { error: "Failed to process re-verification request" },
      { status: 500 }
    );
  }
}
