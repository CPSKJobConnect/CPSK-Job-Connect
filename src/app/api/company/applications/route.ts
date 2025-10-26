import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATION - Check if user has valid session
    const session = await getApiSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZATION - Verify user is a company account
    const account = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!account?.company) {
      return NextResponse.json(
        { error: "Forbidden - Company account not found" },
        { status: 403 }
      );
    }
    // console.log("Company Account:", account);

    // 3. QUERY PARAMETERS - Get optional filters from URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Filter by application status (e.g., "pending", "reviewed")
    const jobId = searchParams.get("jobId"); // Filter by specific job ID

    // 4. BUILD DYNAMIC QUERY - Construct where clause based on filters
    const whereClause: {
      company_id: number;
      id?: number;
    } = {
      company_id: account.company.id,
    };

    // If jobId filter is provided, only fetch that specific job
    if (jobId) {
      whereClause.id = Number(jobId);
    }
    // console.log(whereClause)

    // 5. FETCH DATA - Get all jobs for this company with related data
    const jobs = await prisma.jobPost.findMany({
      where: whereClause,
      include: {
        // Include job type (e.g., "Full-time", "Part-time")
        jobType: {
          select: { name: true },
        },
        // Include arrangement (e.g., "Remote", "On-site", "Hybrid")
        jobArrangement: {
          select: { name: true },
        },
        // Include job categories
        categories: {
          select: { id: true, name: true },
        },
        // Include job tags/skills
        tags: {
          select: { id: true, name: true },
        },
        // Include applications with full details
        applications: {
          // If status filter is provided, only get applications with that status
          where: status
            ? {
                applicationStatus: {
                  name: status.toLowerCase(),
                },
              }
            : undefined,
          include: {
            // Student information
            student: {
              include: {
                account: {
                  select: {
                    email: true,
                    logoUrl: true,
                  },
                },
              },
            },
            // Application status (pending, reviewed, etc.)
            applicationStatus: true,
            // Resume document
            resumeDocument: {
              select: {
                id: true,
                file_path: true,
                file_name: true,
              },
            },
            // Portfolio document
            portfolioDocument: {
              select: {
                id: true,
                file_path: true,
                file_name: true,
              },
            },
          },
          orderBy: { applied_at: "desc" }, // Most recent applications first
        },
        // Count total applications for each job
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { created_at: "desc" }, // Most recent jobs first
    });

    // 6. TRANSFORM DATA - Convert DB format to frontend-friendly format
    const jobsWithApplications = jobs.map((job) => ({
      id: job.id,
      title: job.jobName,
      location: job.location,
      aboutRole: job.aboutRole,
      requirements: job.requirements,
      qualifications: job.qualifications,
      type: job.jobType.name,
      arrangement: job.jobArrangement.name,
      salary: {
        min: job.min_salary,
        max: job.max_salary,
      },
      deadline: job.deadline,
      isPublished: job.is_Published,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      categories: job.categories,
      tags: job.tags,
      totalApplications: job._count.applications,
      // Add description object for frontend compatibility
      description: {
        overview: job.aboutRole,
        responsibility: "", // Empty for now, can add to DB later if needed
        requirement: job.requirements.join(", "),
        qualification: job.qualifications.join(", "),
      },
      // Add company info from session (handle empty strings too)
      companyLogo: (session.user?.logoUrl && session.user.logoUrl.trim()) || "/images/default-logo.png",
      companyBg: (session.user?.backgroundUrl && session.user.backgroundUrl.trim()) || "/images/default-bg.jpg",
      companyName: account.company?.name || "Unknown Company",
      // Add other fields frontend expects
      posted: job.created_at.toISOString(),
      applied: job._count.applications,
      skills: job.tags.map((tag) => tag.name),
      category: job.categories[0]?.name || "",
      status: job.is_Published ? "active" : "draft",
      // Transform applications to frontend format
      applications: job.applications.map((app) => ({
        id: app.id,
        studentId: app.student.id,
        studentName: app.student.name,
        studentEmail: app.student.account.email,
        studentFaculty: app.student.faculty,
        studentYear: app.student.year,
        studentPhone: app.student.phone,
        studentProfilePic: app.student.account.logoUrl,
        status: {
          id: app.applicationStatus.id,
          name: app.applicationStatus.name,
        },
        appliedAt: app.applied_at,
        updatedAt: app.updated_at,
        resume: app.resumeDocument
          ? {
              id: app.resumeDocument.id,
              url: app.resumeDocument.file_path,
              filename: app.resumeDocument.file_name,
            }
          : null,
        portfolio: app.portfolioDocument
          ? {
              id: app.portfolioDocument.id,
              url: app.portfolioDocument.file_path,
              filename: app.portfolioDocument.file_name,
            }
          : null,
      })),
    }));

    // 7. RETURN SUCCESS RESPONSE
    return NextResponse.json(
      {
        success: true,
        data: jobsWithApplications,
      },
      { status: 200 }
    );
  } catch (error) {
    // 8. ERROR HANDLING - Catch any unexpected errors
    console.error("Error fetching company applications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}