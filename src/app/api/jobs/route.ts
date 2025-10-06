import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const test: string = 1234 // Intentional type error for testing

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


    const mappedData = jobs.map((job) => ({
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
    }));
    // console.log("Mapped jobs to JSON:", mappedData);
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}