import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // console.log("🔍 Session debug:", session);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role?.toLowerCase();
    // console.log("🔍 User role:", userRole);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get all statistics in parallel
    const [
      pendingCompanies,
      totalJobPosts,
      totalStudents,
      totalCompanies,
      reportedPosts,
      averageSalary,
      topHiringCompanies,
      successRateByDepartment,
      topSkills,
      recentReports
    ] = await Promise.all([
      // Pending company verification
      prisma.company.count({
        where: { registration_status: "PENDING" }
      }),

      // Total job posts
      prisma.jobPost.count(),

      // Total students
      prisma.student.count(),

      // Total companies
      prisma.company.count({
        where: { registration_status: "APPROVED" }
      }),

      // Reported posts
      prisma.report.count(),

      // Average salary
      prisma.jobPost.aggregate({
        _avg: {
          min_salary: true,
          max_salary: true
        }
      }),

      // Top hiring companies - get grouped data first
      prisma.jobPost.groupBy({
        by: ["company_id"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Success rate by department - we'll calculate this separately
      Promise.resolve([]),

      // Top skills demanded by counting job posts that reference each tag
      prisma.jobTag.findMany({
        select: {
          name: true,
          _count: {
            select: { posts: true }
          }
        },
        orderBy: {
          posts: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent reports
      prisma.report.findMany({
        include: {
          account: true,
          reportType: true
        },
        orderBy: {
          created_at: "desc"
        },
        take: 10
      })
    ]);

    // Calculate success rate by department
    const departmentSuccessRate = await Promise.all(
      ["Software and Knowledge Engineering (SKE)", "Computer Engineering (CPE)"].map(async (faculty) => {
        const totalStudents = await prisma.student.count({
          where: { faculty }
        });

        const acceptedApplications = await prisma.application.count({
          where: {
            student: {
              faculty
            },
            status: 4 // Offered (the actual accepted status)
          }
        });

        return {
          faculty,
          totalStudents,
          acceptedApplications,
          successRate: totalStudents > 0 ? (acceptedApplications / totalStudents) * 100 : 0
        };
      })
    );

    // Process top hiring companies data
    const processedTopCompanies = await Promise.all(
      topHiringCompanies.map(async (entry) => {
        const company = await prisma.company.findUnique({
          where: { id: entry.company_id },
          select: { id: true, name: true },
        });

        const totalApplications = await prisma.application.count({
          where: { jobPost: { company_id: entry.company_id } },
        });

        return {
          id: company?.id ?? 0,
          name: company?.name ?? "Unknown",
          jobPostsCount: entry._count.id,
          totalApplications,
        };
      })
    );

    // Process recent reports
    const processedRecentReports = recentReports.map((report) => ({
      id: report.id,
      createdAt: report.created_at,
      reporterEmail: report.account.email,
      reportName: report.reportType?.name || "Unknown",
      isResolved: report.is_resolved
    }));

    const stats = {
      pendingCompanies,
      totalJobPosts,
      totalStudents,
      totalCompanies,
      reportedPosts,
      averageSalary: {
        min: averageSalary._avg.min_salary || 0,
        max: averageSalary._avg.max_salary || 0,
        overall: ((averageSalary._avg.min_salary || 0) + (averageSalary._avg.max_salary || 0)) / 2
      },
      topHiringCompanies: processedTopCompanies,
      successRateByDepartment: departmentSuccessRate,
      topSkills: topSkills.map((skill) => ({
        name: skill.name,
        count: (skill as { _count?: { posts?: number } })._count?.posts || 0
      })),
      recentReports: processedRecentReports
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
  }
}
