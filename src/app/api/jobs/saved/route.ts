import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST - Save a job
export async function POST(req: Request) {
  try {
    const { userId, jobId } = await req.json();

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "userId and jobId are required" },
        { status: 400 }
      );
    }

    // Find student by account_id
    const student = await prisma.student.findUnique({
      where: { account_id: Number(userId) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if job exists
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: Number(jobId) },
    });

    if (!jobPost) {
      return NextResponse.json(
        { error: "Job post not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        student_id_job_post_id: {
          student_id: student.id,
          job_post_id: Number(jobId),
        },
      },
    });

    if (existingSave) {
      return NextResponse.json(
        { error: "Job already saved" },
        { status: 400 }
      );
    }

    // Create saved job
    const savedJob = await prisma.savedJob.create({
      data: {
        student_id: student.id,
        job_post_id: Number(jobId),
      },
    });

    return NextResponse.json({ savedJob, message: "Job saved successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error saving job:", error);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

// DELETE - Unsave a job
export async function DELETE(req: Request) {
  try {
    const { userId, jobId } = await req.json();

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "userId and jobId are required" },
        { status: 400 }
      );
    }

    // Find student by account_id
    const student = await prisma.student.findUnique({
      where: { account_id: Number(userId) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Delete saved job
    const deletedSave = await prisma.savedJob.delete({
      where: {
        student_id_job_post_id: {
          student_id: student.id,
          job_post_id: Number(jobId),
        },
      },
    });

    return NextResponse.json({ message: "Job unsaved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error unsaving job:", error);
    return NextResponse.json(
      { error: "Failed to unsave job" },
      { status: 500 }
    );
  }
}

// GET - Check if a job is saved or get all saved jobs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Find student by account_id
    const student = await prisma.student.findUnique({
      where: { account_id: Number(userId) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // If jobId is provided, check if specific job is saved
    if (jobId) {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          student_id_job_post_id: {
            student_id: student.id,
            job_post_id: Number(jobId),
          },
        },
      });

      return NextResponse.json({ isSaved: !!savedJob }, { status: 200 });
    }

    // Otherwise, return all saved jobs for the student
    const savedJobs = await prisma.savedJob.findMany({
      where: { student_id: student.id },
      include: {
        jobPost: {
          include: {
            company: {
              include: {
                account: true,
              },
            },
            jobType: true,
            jobArrangement: true,
            categories: true,
            tags: true,
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ savedJobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved jobs" },
      { status: 500 }
    );
  }
}
