import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobs = await prisma.jobPost.findMany({
      include: {
        types: true,
        arrangements: true,
        categories: true,
        tags: true,
      },
    });

    const mappedData = jobs.map((job) => ({
      id: job.id,
      jobName: job.jobName,
      description: {
        aboutRole: job.aboutRole,
        requirements: job.requirements,
        qualifications: job.qualifications,
      },
      minSalary: job.min_salary.toString(),
      maxSalary: job.max_salary.toString(),
      posted: job.created_at,
      location: job.location,
      type: job.types.map((t) => t.name),
      arrangement: job.arrangements.map((a) => a.name),
      category: job.categories.map((c) => c.name),
      tags: job.tags.map((tag) => tag.name),
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}