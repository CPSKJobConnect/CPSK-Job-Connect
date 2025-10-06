import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: Number(params.id) },
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

    const mappedJob = {
      id: job.id,
      companyLogo: job.company.account?.logoUrl ?? "",
      companyBg: job.company.account?.backgroundUrl ?? "",
      jobName: job.jobName,
      companyName: job.company.name,
      category: job.categories.map((c) => c.name),
      location: job.location,
      posted: job.created_at.toISOString(),
      applied: job.applications.length,
      minSalary: job.min_salary.toString(),
      maxSalary: job.max_salary.toString(),
      type: job.jobType.name,
      description: {
        aboutRole: job.aboutRole,
        requirements: job.requirements,
        qualifications: job.qualifications,
      },
      tags: job.tags.map((tag) => tag.name),
      arrangement: job.jobArrangement.name,
    };

    return NextResponse.json(mappedJob);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}