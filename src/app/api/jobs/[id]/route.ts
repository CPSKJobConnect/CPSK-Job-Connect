import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";


export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await context.params;
    const job = await prisma.jobPost.findUnique({
      where: { id: Number(id) },
      include: {
        categories: true,
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

    // Derive status from is_Published and deadline
    let status = "active";
    if (!job.is_Published) {
      status = "draft";
    } else if (job.deadline && new Date(job.deadline) < new Date()) {
      status = "expire";
    }

    const mappedJob = {
      id: job.id,
      companyLogo: job.company.account?.logoUrl ?? "",
      companyBg: job.company.account?.backgroundUrl ?? "",
      title: job.jobName,
      companyName: job.company.name,
      category: job.categories.map((c) => c.name).join(", "),
      location: job.location,
      posted: job.created_at.toISOString(),
      applied: job.applications.length,
      salary: {
        min: Number(job.min_salary),
        max: Number(job.max_salary),
      },
      type: job.jobType.name,
      description: {
        overview: job.aboutRole ?? "",
        responsibility: job.aboutRole ?? "",
        requirement: job.requirements.join("\n"),
        qualification: job.qualifications.join("\n"),
      },
      skills: job.tags.map((tag) => tag.name),
      arrangement: job.jobArrangement.name,
      deadline: job.deadline.toISOString(),
      status,
    };

    return NextResponse.json(mappedJob);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const jobId = Number(id);

    const existingJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.jobPost.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ message: "Job deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}


export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const jobId = Number(id);

    const existingJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { tags: true, categories: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const tagIds = await prisma.jobTag.findMany({
        where: { name: { in: body.skills } },
        select: { id: true }
    });

    const categoryIds = await prisma.jobCategory.findMany({
        where: { name: body.category },
        select: { id: true }
    });

    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        location: body.location ?? existingJob.location,
        job_arrangement_id: body.job_arrangement_id ?? existingJob.job_arrangement_id,
        job_type_id: body.job_type_id ?? existingJob.job_type_id,
        min_salary: body.min_salary ?? existingJob.min_salary,
        max_salary: body.max_salary ?? existingJob.max_salary,
        aboutRole: body.aboutRole ?? existingJob.aboutRole,
        requirements: body.requirements ?? existingJob.requirements,
        qualifications: body.qualifications ?? existingJob.qualifications,
        tags: { set: tagIds },
        categories: { set: categoryIds }
      },
    });

    return NextResponse.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("PATCH /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}