import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { account_id: Number(session.user.id) },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = company.id;

  const jobs = await prisma.jobPost.findMany({
    where: { company_id: companyId },
    include: {
        category: { select: { name: true } },
        tags: true,
        applications: true,
        company: { include: { account: true } },
        jobType: true,
        jobArrangement: true,
        documents: true,
    },
    orderBy: { created_at: "desc" },
  });

    const mappedJobs = jobs.map((job) => {
      let status = "active";
      if (!job.is_Published) status = "draft";
      else if (job.deadline && new Date(job.deadline) < new Date()) status = "expire";

      return {
        id: job.id,
        title: job.jobName,
        companyName: job.company.name,
        companyLogo: job.company.account?.logoUrl || "/default-logo.png",
        companyBg: job.company.account?.backgroundUrl || "/default-bg.png",
        location: job.location,
        posted: job.created_at.toISOString(),
        applied: job.applications.length,
        salary: { min: job.min_salary, max: job.max_salary },
        type: job.jobType.name,
        arrangement: job.jobArrangement.name,
        category: job.category?.name ?? "",
        skills: job.tags.map((t) => t.name),
        deadline: job.deadline.toISOString(),
        status,
        description: {
            overview: job.aboutRole ?? "",
            responsibility: job.responsibilities ?? "-",
            requirement: job.requirements.join("\n"),
            qualification: job.qualifications.join("\n"),
        },
        documents: job.documents.map((doc) => doc.name),
      };
    });

    return NextResponse.json(mappedJobs, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
