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

    // Check if company is verified (APPROVED status)
    if (account.company.registration_status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your company must be verified before posting jobs. Please check your verification status in your profile page and wait for admin approval." },
        { status: 403 }
      );
    }
    const tagIds = await prisma.jobTag.findMany({
      where: { name: { in: body.skills } },
      select: { id: true },
    });

    let documentIds: Array<{ id: number }> = [];
    if (Array.isArray(body.requiredDocuments) && body.requiredDocuments.length) {
      const inputSet = new Set(
        body.requiredDocuments.map((s: any) => String(s).toLowerCase().replace(/\s+/g, ""))
      );
      const allDocTypes = await prisma.documentType.findMany({ select: { id: true, name: true } });
      documentIds = allDocTypes
        .filter((d) => {
          const nameNorm = d.name.toLowerCase().replace(/\s+/g, "");
          return inputSet.has(nameNorm) || inputSet.has(d.name.toLowerCase());
        })
        .map((d) => ({ id: d.id }));
    }

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
        updated_at: new Date(),

        job_type_id: jobType.id,
        job_arrangement_id: jobArrangement.id,
        job_category_id: categoryId,

        tags: tagIds.length
          ? {
              connect: tagIds.map(tag => ({ id: tag.id })),
            }
          : undefined,
        
        documents: documentIds.length 
          ? {
              connect: documentIds.map((doc: { id: number }) => ({ id: doc.id })),
            }
          : undefined,
        }
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}