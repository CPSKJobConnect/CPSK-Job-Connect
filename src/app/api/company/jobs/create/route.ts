import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withResponseCsrfGuard } from '@/lib/csrfGuard';
import DOMPurify from "isomorphic-dompurify";

async function POST_impl(request: NextRequest) {
  try {
    const session = await getApiSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Canonicalize / decode input (1.1.1)
    const bodyRaw = await request.text();
    let body;
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Sanitize string inputs from WYSIWYG or text fields (1.3.1)
    const title = DOMPurify.sanitize(body.title || "");
    const location = DOMPurify.sanitize(body.location || "");
    const descriptionOverview = DOMPurify.sanitize(body.description?.overview || "");
    const descriptionResponsibility = DOMPurify.sanitize(body.description?.responsibility || "-");
    const descriptionRequirement = DOMPurify.sanitize(body.description?.requirement || "");
    const descriptionQualification = DOMPurify.sanitize(body.description?.qualification || "");

    // Validate and canonicalize job arrangement
    const jobArrangementName = decodeURIComponent(body.arrangement || "");
    const jobArrangement = await prisma.jobArrangement.findUnique({
      where: { name: jobArrangementName },
    });

    if (!jobArrangement) {
      return NextResponse.json({ error: "Job arrangement not found" }, { status: 400 });
    }

    // Validate and canonicalize job type
    const jobTypeName = decodeURIComponent(body.type || "");
    const jobType = await prisma.jobType.findUnique({
      where: { name: jobTypeName },
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

    // Check if company is verified
    if (account.company.registration_status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your company must be verified before posting jobs." },
        { status: 403 }
      );
    }

    // Handle tags
    const tagIds: { id: number }[] = [];
    if (body.skills?.length) {
      for (const skillNameRaw of body.skills) {
        const skillName = DOMPurify.sanitize(skillNameRaw);
        let tag = await prisma.jobTag.findFirst({ where: { name: skillName } });
        if (!tag) {
          tag = await prisma.jobTag.create({ data: { name: skillName } });
        }
        tagIds.push({ id: tag.id });
      }
    }

    // Handle required documents
    let documentIds: Array<{ id: number }> = [];
    if (Array.isArray(body.requiredDocuments) && body.requiredDocuments.length) {
      const inputSet = new Set(
        body.requiredDocuments.map((s: any) => String(s).toLowerCase().replace(/\s+/g, ""))
      );
      const allDocTypes = await prisma.documentType.findMany({ select: { id: true, name: true } });
      documentIds = allDocTypes
        .filter((d) => inputSet.has(d.name.toLowerCase().replace(/\s+/g, "")))
        .map((d) => ({ id: d.id }));
    }

    // Handle category
    let categoryId: number | null = null;
    if (body.category) {
      const categoryName = decodeURIComponent(body.category);
      const category = await prisma.jobCategory.findUnique({ where: { name: categoryName } });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
      categoryId = category.id;
    }

    // Create job post
    const newJob = await prisma.jobPost.create({
      data: {
        company_id: account.company.id,
        jobName: title,
        location,
        aboutRole: descriptionOverview,
        responsibilities: descriptionResponsibility,
        requirements: descriptionRequirement
          ? descriptionRequirement.split(",").map((s: string) => s.trim())
          : [],
        qualifications: descriptionQualification
          ? descriptionQualification.split(",").map((s: string) => s.trim())
          : [],
        min_salary: Number(body.salary?.min) || 0,
        max_salary: Number(body.salary?.max) || 0,
        deadline: new Date(body.deadline),
        is_Published: body.is_published ?? true,
        updated_at: new Date(),

        job_type_id: jobType.id,
        job_arrangement_id: jobArrangement.id,
        job_category_id: categoryId,

        tags: tagIds.length ? { connect: tagIds } : undefined,
        documents: documentIds.length ? { connect: documentIds } : undefined,
      },
    });

    return NextResponse.json(newJob, { status: 201 });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating job:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
