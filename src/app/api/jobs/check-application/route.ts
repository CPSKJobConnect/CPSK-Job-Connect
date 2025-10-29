import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        student_id: student.id,
        job_post_id: Number(jobId),
      },
    });

    return NextResponse.json({ applied: !!existingApplication }, { status: 200 });
  } catch (error) {
    console.error("Error checking application:", error);
    return NextResponse.json(
      { error: "Failed to check application" },
      { status: 500 }
    );
  }
}