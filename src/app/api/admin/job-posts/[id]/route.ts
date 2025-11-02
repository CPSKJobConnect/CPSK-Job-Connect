import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET - Fetch single job post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!account || account.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: {
          include: {
            account: {
              select: {
                email: true
              }
            }
          }
        },
        jobType: true,
        jobArrangement: true,
        category: true,
        tags: true,
        applications: {
          include: {
            student: {
              include: {
                account: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    return NextResponse.json(jobPost, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch job post" }, { status: 500 });
  }
}

// PUT - Update job post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!account || account.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const {
      jobName,
      location,
      aboutRole,
      requirements,
      qualifications,
      minSalary,
      maxSalary,
      deadline,
      isPublished,
      jobTypeId,
      jobArrangementId,
      categoryId,
      tagIds
    } = data;

    // First, disconnect existing tags
    await prisma.jobPost.update({
      where: { id: parseInt(id) },
      data: {
        tags: {
          set: []
        }
      }
    });

    const jobPost = await prisma.jobPost.update({
      where: { id: parseInt(id) },
      data: {
        jobName,
        location,
        aboutRole,
        requirements,
        qualifications,
        min_salary: minSalary,
        max_salary: maxSalary,
        deadline: new Date(deadline),
        is_Published: isPublished,
        job_arrangement_id: jobArrangementId,
        job_type_id: jobTypeId,
        job_category_id: categoryId,
        tags: {
          connect: tagIds.map((id: number) => ({ id }))
        }
      },
      include: {
        company: true,
        jobType: true,
        jobArrangement: true,
        category: true,
        tags: true
      }
    });

    return NextResponse.json(jobPost, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update job post" }, { status: 500 });
  }
}

// DELETE - Delete job post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!account || account.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.jobPost.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Job post deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to delete job post" }, { status: 500 });
  }
}
