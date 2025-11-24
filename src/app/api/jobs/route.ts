import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    let studentId: number | null = null;

    // Canonicalize and validate userId input (OWASP ASVS 1.1.1)
    const rawUserId = searchParams.get("userId");
    if (rawUserId) {
      const decodedUserId = decodeURIComponent(rawUserId); // canonicalization
      const parsedId = Number(decodedUserId);
      if (!Number.isNaN(parsedId)) {
        const student = await prisma.student.findUnique({
          where: { account_id: parsedId },
        });
        studentId = student?.id ?? null;
      }
    }

    const today = new Date();

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

    const mappedData = jobs.map((job) => {
      let status = "active";
      if (!job.is_Published) {
        status = "draft";
      } else if (job.deadline && new Date(job.deadline) < new Date()) {
        status = "expire";
      }

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

    return NextResponse.json(mappedData);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("API error:", error);
    }
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
