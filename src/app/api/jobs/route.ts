import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let studentId: number | null = null;

    // If userId is provided, find the corresponding student
    if (userId) {
      const student = await prisma.student.findUnique({
        where: { account_id: Number(userId) },
      });
      studentId = student?.id ?? null;
    }

    const today = new Date();

    // Removed unknown 'documents' include to satisfy Prisma include typing.
    // Cast result to any[] so TypeScript won't complain about optional relation properties.
    const jobs = (await prisma.jobPost.findMany({
      where: {
        is_Published: true,
        deadline: {
          gte: today,
        },
      },
      include: {
        category: true,
        tags: true,
        applications: true,
        company: {
          include: {
            account: true,
          },
        },
        jobType: true,
        jobArrangement: true,
        savedBy: studentId
          ? {
              where: {
                student_id: studentId,
              },
            }
          : false,
      },
    })) as any[];


    type JobWithRelations = {
      id: number;
      is_Published: boolean;
      deadline: Date;
      savedBy: unknown;
      jobName: string;
      company: { name: string; account: { logoUrl: string | null; backgroundUrl: string | null } | null };
      category: { id: number; name: string } | null;
      location: string;
      created_at: Date;
      applications: unknown[];
      min_salary: number | bigint;
      max_salary: number | bigint;
      jobType: { name: string };
      aboutRole: string | null;
      responsibilities: string | null,
      requirements: string[];
      qualifications: string[];
      tags: { name: string }[];
      documents?: { name: string }[]; // optional now, guard access at runtime
      jobArrangement: { name: string };
    };

  const mappedData = jobs.map((job) => {
      // Derive status from is_Published and deadline
      let status = "active";
      if (!job.is_Published) {
        status = "draft";
      } else if (job.deadline && new Date(job.deadline) < new Date()) {
        status = "expire";
      }

      // Check if the job is saved by the current user
      const isSaved = Array.isArray(job.savedBy) && job.savedBy.length > 0;

      return {
        id: job.id,
        companyLogo: job.company.account?.logoUrl ?? "",
        companyBg: job.company.account?.backgroundUrl ?? "",
        title: job.jobName,
        companyName: job.company.name,
        category: job.category ? job.category.name : "",
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
        requiredDocuments: Array.isArray(job.documents) ? job.documents.map((d: { name: string }) => d.name) : [],
        arrangement: job.jobArrangement.name,
        deadline: job.deadline ? job.deadline.toISOString() : null,
        status,
        isSaved,
      };
    });
    // console.log("Mapped jobs to JSON:", mappedData);
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}