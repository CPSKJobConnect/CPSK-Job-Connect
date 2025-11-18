import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ← Required fix
    const companyId = Number(id);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const jobs = await prisma.jobPost.findMany({
      where: { company_id: companyId },
      include: {
        category: true,
        tags: true,
        applications: true,
        company: { include: { account: true } },
        jobType: true,
        jobArrangement: true,
      },
    });

    const mapped = jobs.map((job) => ({
      id: String(job.id),
      title: job.jobName,
      category: job.category?.name ?? "",
      location: job.location,
      type: job.jobType?.name ?? "",
      arrangement: job.jobArrangement?.name ?? "",
      salary: { min: Number(job.min_salary), max: Number(job.max_salary) },
      posted: job.created_at.toISOString(),
      deadline: job.deadline.toISOString(),
      status: !job.is_Published
        ? "draft"
        : new Date(job.deadline) < new Date()
        ? "expire"
        : "active",
      skills: job.tags.map((t) => t.name),
      applied: job.applications.length,
      companyName: job.company.name,
      companyLogo: job.company.account?.logoUrl ?? "",
      companyBg: job.company.account?.backgroundUrl ?? "",
      description: {
        overview: job.aboutRole ?? "",
        responsibility: job.responsibilities ?? "-",
        requirement: job.requirements?.join("\n") ?? "",
        qualification: job.qualifications?.join("\n") ?? "",
      },
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/company/[id]/jobs", error);
    return NextResponse.json([], { status: 500 });
  }
}

