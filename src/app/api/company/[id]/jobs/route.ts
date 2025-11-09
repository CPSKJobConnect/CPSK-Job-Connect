import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const companyId = Number(id); // id from the route

    // Prisma query using correct field name: company_id
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

    // Map the jobs to match JobDescriptionCard expected format
    const mappedJobs = jobs.map((job) => ({
      id: job.id.toString(),
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
        : job.deadline && new Date(job.deadline) < new Date()
        ? "expire"
        : "active",
      skills: job.tags.map((t) => t.name),
      applied: job.applications.length,

      companyName: job.company.name,
      companyLogo: job.company.account?.logoUrl || "", // default empty string
      companyBg: job.company.account?.backgroundUrl || "",

      description: {
        overview: job.aboutRole ?? "",
        responsibility: job.responsibilities ?? "-",
        requirement: job.requirements?.join("\n") ?? "",
        qualification: job.qualifications?.join("\n") ?? "",
      },
    }));

    return NextResponse.json(mappedJobs);
  } catch (error) {
    console.error("GET /api/company/[id]/jobs error:", error);
    // return empty array instead of 500 to avoid frontend errors
    return NextResponse.json([]);
  }
}
