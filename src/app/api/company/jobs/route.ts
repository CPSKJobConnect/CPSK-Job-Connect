import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DOMPurify from "isomorphic-dompurify";

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
        documents: true,
        applications: true,
        company: { include: { account: true } },
        jobType: true,
        jobArrangement: true,
      },
      orderBy: { created_at: "desc" },
    });

    const mappedJobs = jobs.map((job) => {
      let jobStatus = "active";
      if (!job.is_Published) jobStatus = "draft";
      else if (job.deadline && new Date(job.deadline) < new Date()) jobStatus = "expire";

      return {
        id: job.id,
        title: DOMPurify.sanitize(job.jobName),
        companyName: DOMPurify.sanitize(job.company.name),
        companyLogo: job.company.account?.logoUrl || "/default-logo.png",
        companyBg: job.company.account?.backgroundUrl || "/default-bg.png",
        location: DOMPurify.sanitize(job.location),
        posted: job.created_at.toISOString(),
        applied: job.applications.length,
        salary: { min: job.min_salary, max: job.max_salary },
        type: DOMPurify.sanitize(job.jobType.name),
        arrangement: DOMPurify.sanitize(job.jobArrangement.name),
        category: DOMPurify.sanitize(job.category?.name ?? ""),
        skills: job.tags.map((t) => DOMPurify.sanitize(t.name)),
        documents: Array.isArray(job.documents) ? job.documents.map((d: any) => DOMPurify.sanitize(d.name)) : [],
        deadline: job.deadline.toISOString(),
        status: jobStatus,
        description: {
          overview: DOMPurify.sanitize(job.aboutRole ?? ""),
          responsibility: DOMPurify.sanitize(job.responsibilities ?? "-"),
          requirement: DOMPurify.sanitize(job.requirements.join("\n")),
          qualification: DOMPurify.sanitize(job.qualifications.join("\n")),
        },
      };
    });

    return NextResponse.json(mappedJobs, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
