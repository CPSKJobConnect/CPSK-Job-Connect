import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const jobIdRaw = body.jobId;

    if (!jobIdRaw) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // Canonicalize jobId
    const jobId = Number(decodeURIComponent(jobIdRaw.toString()));
    if (isNaN(jobId) || jobId <= 0) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
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
        job_post_id: jobId,
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
