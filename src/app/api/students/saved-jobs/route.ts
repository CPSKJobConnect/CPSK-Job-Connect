import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        student_id: student.id,
        job_post_id: Number(jobId),
      },
    });

    return NextResponse.json(
      { savedJob, message: "Job saved successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Job already saved" },
        { status: 400 }
      );
    }
    logDebug("Error saving job:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to save job to bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required, bad request" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    await prisma.savedJob.delete({
      where: {
        student_id_job_post_id: {
          student_id: student.id,
          job_post_id: Number(jobId),
        }
      },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "Job unsaved successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Job was not saved/bookmarked." },
        { status: 404 }
      );
    }
    logDebug("Error unsaving job:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to unsave job from bookmark" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const jobId = request.nextUrl.searchParams.get("jobId");

    const student = await prisma.student.findUnique({
      where: { account_id: parseInt(session.user.id) },
    });
    if (!student){
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    if (jobId) {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          student_id_job_post_id: {
            student_id: student.id,
            job_post_id: Number(jobId),
          },
        },
      });
      return NextResponse.json(
        { isSaved: !!savedJob },
        { status: 200 }
      );
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { student_id: student.id },
      include: {
        jobPost: {
          include: {
            company: {
              include: { account: true }
            },
            jobType: true,
            jobArrangement: true,
            category: true,
            tags: true,
            applications: {
              where: { student_id: student.id },
              select: { id: true }
            },
            _count: { select: { applications: true } }
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const transformedJobs = savedJobs.map((savedJob: any) => ({
      job: {
        id: String(savedJob.jobPost.id),
        companyLogo: savedJob.jobPost.company.account.logoUrl || "/default-logo.png",
        companyBg: savedJob.jobPost.company.account.backgroundUrl || "/default-bg.png",
        title: sanitizeHtml(savedJob.jobPost.jobName),
        companyName: sanitizeHtml(savedJob.jobPost.company.name),
        category: sanitizeHtml(savedJob.jobPost.category?.name || "General"),
        location: sanitizeHtml(savedJob.jobPost.location),
        posted: savedJob.jobPost.created_at.toISOString(),
        applied: savedJob.jobPost._count.applications,
        salary: {
          min: savedJob.jobPost.min_salary,
          max: savedJob.jobPost.max_salary
        },
        skills: savedJob.jobPost.tags.map((tag: { name: string }) => sanitizeHtml(tag.name)),
        description: {
          overview: sanitizeHtml(savedJob.jobPost.aboutRole),
          responsibility: sanitizeHtml(savedJob.jobPost.aboutRole),
          requirement: sanitizeHtml(savedJob.jobPost.requirements.join("\n")),
          qualification: sanitizeHtml(savedJob.jobPost.qualifications.join("\n"))
        },
        type: sanitizeHtml(savedJob.jobPost.jobType.name.toLowerCase()),
        arrangement: sanitizeHtml(savedJob.jobPost.jobArrangement.name.toLowerCase()),
        deadline: savedJob.jobPost.deadline.toISOString(),
        status: savedJob.jobPost.deadline < new Date() ? "expire" : "active",
        isSaved: true
      },
      added_at: savedJob.created_at.toISOString(),
      isBookmarked: true,
      isApplied: savedJob.jobPost.applications.length > 0
    }));

    return NextResponse.json(
      { savedJobs: transformedJobs },
      { status: 200 }
    );

  } catch (error) {
    logDebug("Error fetching saved jobs:", error);
    return NextResponse.json(
      { error: "Internal Server Error, Failed to fetch saved jobs" },
      { status: 500 }
    );
  }
}
