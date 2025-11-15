import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// =========================
// GET SINGLE JOB
// =========================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // FIX
    const jobId = Number(id);

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        tags: true,
        applications: true,
        company: { include: { account: true } },
        jobType: true,
        jobArrangement: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const status =
      !job.is_Published
        ? "draft"
        : job.deadline && new Date(job.deadline) < new Date()
        ? "expire"
        : "active";

    return NextResponse.json({
      id: job.id,
      title: job.jobName,
      companyName: job.company.name,
      companyLogo: job.company.account?.logoUrl ?? "",
      companyBg: job.company.account?.backgroundUrl ?? "",
      type: job.jobType?.name ?? "",
      arrangement: job.jobArrangement?.name ?? "",
      category: job.category?.name ?? "",
      location: job.location,
      applied: job.applications.length,
      skills: job.tags.map((t) => t.name),
      salary: { min: Number(job.min_salary), max: Number(job.max_salary) },
      description: {
        overview: job.aboutRole ?? "",
        responsibility: job.responsibilities ?? "",
        requirement: job.requirements?.join("\n") ?? "",
        qualification: job.qualifications?.join("\n") ?? "",
      },
      deadline: job.deadline?.toISOString() ?? null,
      posted: job.created_at.toISOString(),
      status,
    });
  } catch (err) {
    console.error("GET /api/company/jobs/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

// =========================
// DELETE JOB
// =========================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // FIX
    const jobId = Number(id);

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Ownership validation could be added here

    await prisma.jobPost.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/company/jobs/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

// =========================
// PATCH / UPDATE JOB
// =========================
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // FIX
    const jobId = Number(id);
    const body = await request.json();

    const existingJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        jobName: body.title ?? existingJob.jobName,
        location: body.location ?? existingJob.location,
        min_salary: body.min_salary ?? existingJob.min_salary,
        max_salary: body.max_salary ?? existingJob.max_salary,
        aboutRole: body.description?.overview ?? existingJob.aboutRole,
        responsibilities: body.description?.responsibility ?? existingJob.responsibilities,

        requirements: body.description?.requirement
          ? body.description.requirement
              .split("\n")
              .map((x: string) => x.trim())
              .filter(Boolean)
          : existingJob.requirements,

        qualifications: body.description?.qualification
          ? body.description.qualification
              .split("\n")
              .map((x: string) => x.trim())
              .filter(Boolean)
          : existingJob.qualifications,
      },
    });

    return NextResponse.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (err) {
    console.error("PATCH /api/company/jobs/[id] error:", err);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
