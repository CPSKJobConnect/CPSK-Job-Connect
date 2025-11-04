import { uploadDocument } from "@/lib/uploadDocument";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const jobId = Number(formData.get("jobId"));
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const resumeFile = formData.get("resume") as File | null;
    const resumeId = formData.get("resumeId") as string | null;
    const portfolioFile = formData.get("portfolio") as File | null;
    const portfolioId = formData.get("portfolioId") as string | null;

    let resumeDoc, portfolioDoc;

    if (resumeFile) {
      resumeDoc = await uploadDocument(resumeFile, session.user.id, 1);
    } else if (resumeId) {
      resumeDoc = { id: Number(resumeId) };
    }

    if (portfolioFile) {
      portfolioDoc = await uploadDocument(portfolioFile, session.user.id, 3);
    } else if (portfolioId) {
      portfolioDoc = { id: Number(portfolioId) };
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
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

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        student_id: student.id,
        job_post_id: jobId,
        status: 1, // pending หรือ waiting
        resume_id: resumeDoc?.id,
        portfolio_id: portfolioDoc?.id,
      },
      include: {
        jobPost: {
          include: {
            company: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        account_id: application.jobPost.company.account_id,
        message: `${student.name} has applied for your job post "${application.jobPost.jobName}".`,
        sender_id: Number(session.user.id),
      },
    });

    return NextResponse.json({ success: true, application }, { status: 200 });
  } catch (error) {
    console.error("❌ Error applying to job:", error);
    return NextResponse.json(
      { error: "Failed to apply to job" },
      { status: 500 }
    );
  }
}
