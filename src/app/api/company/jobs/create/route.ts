import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const jobArrangement = await prisma.jobArrangement.findUnique({
      where: { name: body.arrangement },
    });

    if (!jobArrangement) {
      return NextResponse.json({ error: "Job arrangement not found" }, { status: 400 });
    }

    const jobType = await prisma.jobType.findUnique({
      where: { name: body.type },
    });

    if (!jobType) {
      return NextResponse.json({ error: "Job type not found" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { company: true },
    });

    if (!account?.company) {
      return NextResponse.json(
        { error: "Company not found for this account" },
        { status: 400 }
      );
    }
    const tagIds = await prisma.jobTag.findMany({
      where: { name: { in: body.skills } },
      select: { id: true },
    });

    let categoryId: number | null = null;
    if (body.category) {
      const category = await prisma.jobCategory.findUnique({
        where: { name: body.category },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
      categoryId = category.id;
    }

    const newJob = await prisma.jobPost.create({
      data: {
        company_id: account.company.id,
        jobName: body.title,
        location: body.location,
        aboutRole: body.description?.overview || "",
        responsibilities: body.description?.responsibility || "-",
        requirements: body.description?.requirement
          ? body.description.requirement.split(",").map((s: string) => s.trim())
          : [],
        qualifications: body.description?.qualification
          ? body.description.qualification.split(",").map((s: string) => s.trim())
          : [],
        min_salary: Number(body.salary?.min) || 0,
        max_salary: Number(body.salary?.max) || 0,
        deadline: new Date(body.deadline),
        is_Published: body.is_published ?? true,

        job_type_id: jobType.id,
        job_arrangement_id: jobArrangement.id,
        job_category_id: categoryId,

        tags: tagIds.length
          ? {
              connect: tagIds.map(tag => ({ id: tag.id })),
            }
          : undefined,
      },
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
