import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("🔍 Session debug:", session);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    console.log("🔍 User role:", userRole);

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        where: { registration_status: "pending" }
      }),

      // Total job posts
      prisma.jobPost.count(),

      // Total students
      prisma.student.count(),

      // Total companies
      prisma.company.count({
        where: { registration_status: "approved" }
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

      // Top hiring companies (Top 10)
      prisma.company.findMany({
        where: { registration_status: "approved" },
        include: {
          jobPosts: {
            include: {
              applications: true
            }
          }
        },
        orderBy: {
          jobPosts: {
            _count: "desc"
          }
        },
        take: 10
      }),

      // Success rate by department - we'll calculate this separately
      Promise.resolve([]),

      // Top skills demanded by counting job posts that reference each tag
      prisma.jobTag.findMany({
        select: {
          name: true,
          _count: {
            select: { jobPosts: true }
          }
        },
        orderBy: {
          jobPosts: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent reports
      prisma.report.findMany({
        include: {
          account: true
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
            status: 3 // Accepted
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
    const processedTopCompanies = topHiringCompanies.map(company => ({
      id: company.id,
      name: company.name,
      jobPostsCount: company.jobPosts.length,
      totalApplications: company.jobPosts.reduce((sum, post) => sum + post.applications.length, 0)
    }));

    // Process recent reports
    const processedRecentReports = recentReports.map(report => ({
      id: report.id,
      type: report.type,
      createdAt: report.created_at,
      reporterEmail: report.account.email
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
      topSkills: topSkills.map(skill => ({
        name: skill.name,
        count: (skill as any)._count?.jobPosts || 0
      })),
      recentReports: processedRecentReports
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
  }
}
