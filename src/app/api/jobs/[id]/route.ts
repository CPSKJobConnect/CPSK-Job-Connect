import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const job = await prisma.jobPost.findUnique({
      where: { id: Number(id) },
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
      category: job.category?.name ?? "",
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
        responsibility: job.responsibilities ?? "-",
        requirement: job.requirements.join("\n"),
        qualification: job.qualifications.join("\n"),
      },
      skills: job.tags.map((tag: { name: string }) => tag.name),
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
    const { getApiSession } = await import("@/lib/api-auth");
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const jobId = Number(id);

    const existingJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify the company owns this job
    if (existingJob.company.account_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Forbidden: You don't own this job" }, { status: 403 });
    }

    // Check if company is still verified
    if (existingJob.company.registration_status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your company must be verified to manage jobs. Please check your verification status in your profile page." },
        { status: 403 }
      );
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
    const { getApiSession } = await import("@/lib/api-auth");
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const jobId = Number(id);

    const existingJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { tags: true, category: true, company: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify the company owns this job
    if (existingJob.company.account_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Forbidden: You don't own this job" }, { status: 403 });
    }

    // Check if company is still verified
    if (existingJob.company.registration_status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your company must be verified to manage jobs. Please check your verification status in your profile page." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const arrangement = body.arrangement
      ? await prisma.jobArrangement.findUnique({ where: { name: body.arrangement } })
      : null;


    const type = body.type
      ? await prisma.jobType.findUnique({ where: { name: body.type } })
      : null;

    if ((body.arrangement && !arrangement) || (body.type && !type)) {
      return NextResponse.json({ error: "Invalid arrangement or type" }, { status: 400 });
    }

    const tagIds = body.tags?.length
      ? await prisma.jobTag.findMany({
          where: { name: { in: body.tags } },
          select: { id: true },
        })
      : [];

    let categoryId = existingJob.job_category_id;
    if (body.category) {
      const category = await prisma.jobCategory.findUnique({ where: { name: body.category } });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
      categoryId = category.id;
    }

    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        location: body.location ?? existingJob.location,
        job_arrangement_id: arrangement?.id ?? existingJob.job_arrangement_id,
        job_type_id: type?.id ?? existingJob.job_type_id,
        min_salary: body.min_salary ?? existingJob.min_salary,
        max_salary: body.max_salary ?? existingJob.max_salary,
        aboutRole: body.aboutRole ?? existingJob.aboutRole,
        responsibilities: body.responsibilities ?? existingJob.responsibilities,
        requirements: body.requirements ?? existingJob.requirements,
        qualifications: body.qualifications ?? existingJob.qualifications,
        tags: tagIds.length ? { set: tagIds.map(tag => ({ id: tag.id })) } : undefined,
        job_category_id: categoryId,
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