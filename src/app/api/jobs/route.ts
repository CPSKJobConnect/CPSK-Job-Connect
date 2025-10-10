import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    const jobs = await prisma.jobPost.findMany({
      include: {
        categories: true,
        tags: true,
        applications: true,
        company: {
          include: {
            account: true,
          },
        },
        jobType: true,
        jobArrangement: true,
      },
    });


    const mappedData = jobs.map((job) => {
      // Derive status from is_Published and deadline
      let status = "active";
      if (!job.is_Published) {
        status = "draft";
      } else if (job.deadline && new Date(job.deadline) < new Date()) {
        status = "expire";
      }

      return {
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
    });
    // console.log("Mapped jobs to JSON:", mappedData);
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}