import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------------
    // ✅ ASVS 1.1.1 Canonicalization
    // -----------------------------------------
    const userRole = String(session.user.role || "")
      .trim()
      .toLowerCase();

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch stats in parallel
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
      prisma.company.count({
        where: { registration_status: "PENDING" }
      }),
      prisma.jobPost.count(),
      prisma.student.count(),
      prisma.company.count({
        where: { registration_status: "APPROVED" }
      }),
      prisma.report.count(),
      prisma.jobPost.aggregate({
        _avg: {
          min_salary: true,
          max_salary: true
        }
      }),
      prisma.jobPost.groupBy({
        by: ["company_id"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      }),
      Promise.resolve([]),
      prisma.jobTag.findMany({
        select: {
          name: true,
          _count: {
            select: { posts: true }
          }
        },
        orderBy: {
          posts: {
            _count: "desc"
          }
        },
        take: 10
      }),
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

    // Success by faculty
    const departmentSuccessRate = await Promise.all(
      ["Software and Knowledge Engineering (SKE)", "Computer Engineering (CPE)"].map(async (faculty) => {
        const totalStudents = await prisma.student.count({
          where: { faculty }
        });

        const acceptedApplications = await prisma.application.count({
          where: {
            student: { faculty },
            status: 4
          }
        });

        return {
          faculty: DOMPurify.sanitize(faculty),
          totalStudents,
          acceptedApplications,
          successRate:
            totalStudents > 0
              ? (acceptedApplications / totalStudents) * 100
              : 0
        };
      })
    );

    // Process top hiring companies
    const processedTopCompanies = await Promise.all(
      topHiringCompanies.map(async (entry) => {
        const company = await prisma.company.findUnique({
          where: { id: entry.company_id },
          select: { id: true, name: true }
        });

        const totalApplications = await prisma.application.count({
          where: { jobPost: { company_id: entry.company_id } }
        });

        return {
          id: company?.id ?? 0,
          name: DOMPurify.sanitize(company?.name || "Unknown"),
          jobPostsCount: entry._count.id,
          totalApplications
        };
      })
    );

    // Process recent reports
    const processedRecentReports = recentReports.map((report) => ({
      id: report.id,
      createdAt: report.created_at,
      reporterEmail: DOMPurify.sanitize(report.account.email),
      reportName: DOMPurify.sanitize(report.reportType?.name || "Unknown"),
      isResolved: report.is_resolved
    }));

    // -----------------------------------------
    // Final sanitized output
    // -----------------------------------------
    const stats = {
      pendingCompanies,
      totalJobPosts,
      totalStudents,
      totalCompanies,
      reportedPosts,
      averageSalary: {
        min: averageSalary._avg.min_salary || 0,
        max: averageSalary._avg.max_salary || 0,
        overall:
          ((averageSalary._avg.min_salary || 0) +
            (averageSalary._avg.max_salary || 0)) /
          2
      },
      topHiringCompanies: processedTopCompanies,
      successRateByDepartment: departmentSuccessRate,
      topSkills: topSkills.map((skill) => ({
        name: DOMPurify.sanitize(skill.name),
        count: skill._count?.posts || 0
      })),
      recentReports: processedRecentReports
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
        console.error("API error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
