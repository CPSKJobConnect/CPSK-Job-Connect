import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET - Fetch all job posts with pagination and filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    console.log("🔍 User role:", userRole);

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const reported = searchParams.get("reported") || "";

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { jobName: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
        { location: { contains: search, mode: "insensitive" } }
      ];
    }

    if (status) {
      whereClause.is_Published = status === "published";
    }

    if (reported === "true") {
      // Filter for job posts that have reports
      whereClause.id = {
        in: await prisma.report.findMany({
          select: { post_id: true },
          distinct: ['post_id']
        }).then(reports => reports.map(r => r.post_id))
      };
    }

    const [jobPosts, totalCount] = await Promise.all([
      prisma.jobPost.findMany({
        where: whereClause,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              account: {
                select: {
                  email: true
                }
              }
            }
          },
          jobType: true,
          jobArrangement: true,
          categories: true,
          tags: true,
          applications: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        },
        skip,
        take: limit
      }),
      prisma.jobPost.count({ where: whereClause })
    ]);

    const processedJobPosts = jobPosts.map(post => ({
      id: post.id,
      jobName: post.jobName,
      company: post.company,
      location: post.location,
      minSalary: post.min_salary,
      maxSalary: post.max_salary,
      deadline: post.deadline,
      isPublished: post.is_Published,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      jobType: post.jobType.name,
      jobArrangement: post.jobArrangement.name,
      categories: post.categories.map(cat => cat.name),
      tags: post.tags.map(tag => tag.name),
      applicationsCount: post.applications.length,
      acceptedApplications: post.applications.filter(app => app.status === 3).length
    }));

    return NextResponse.json({
      jobPosts: processedJobPosts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch job posts" }, { status: 500 });
  }
}

// POST - Create new job post
export async function POST(request: Request) {
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

    if (!account || account.accountRole?.name !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const {
      companyId,
      jobName,
      location,
      aboutRole,
      requirements,
      qualifications,
      minSalary,
      maxSalary,
      deadline,
      jobTypeId,
      jobArrangementId,
      categoryIds,
      tagIds
    } = data;

    const jobPost = await prisma.jobPost.create({
      data: {
        company_id: companyId,
        jobName,
        location,
        aboutRole,
        requirements,
        qualifications,
        min_salary: minSalary,
        max_salary: maxSalary,
        deadline: new Date(deadline),
        job_arrangement_id: jobArrangementId,
        job_type_id: jobTypeId,
        categories: {
          connect: categoryIds.map((id: number) => ({ id }))
        },
        tags: {
          connect: tagIds.map((id: number) => ({ id }))
        }
      },
      include: {
        company: true,
        jobType: true,
        jobArrangement: true,
        categories: true,
        tags: true
      }
    });

    return NextResponse.json(jobPost, { status: 201 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to create job post" }, { status: 500 });
  }
}
