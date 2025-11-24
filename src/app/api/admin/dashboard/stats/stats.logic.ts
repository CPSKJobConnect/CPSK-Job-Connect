import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";

export async function getDashboardStats() {
  // --- Basic counts and aggregates ---
  const [
    pendingCompanies,
    totalJobPosts,
    totalStudents,
    totalCompanies,
    reportedPosts,
    averageSalary,
    topSkills,
    recentReports,
  ] = await Promise.all([
    prisma.company.count({ where: { registration_status: "PENDING" } }),
    prisma.jobPost.count(),
    prisma.student.count(),
    prisma.company.count({ where: { registration_status: "APPROVED" } }),
    prisma.report.count(),
    prisma.jobPost.aggregate({
      _avg: { min_salary: true, max_salary: true },
    }),
    prisma.jobTag.findMany({
      select: {
        name: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 10,
    }),
    prisma.report.findMany({
      include: { account: true },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
  ]);

  // --- Top Hiring Companies ---
  const topHiringData = await prisma.jobPost.groupBy({
    by: ["company_id"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const topHiringCompanies = await Promise.all(
    topHiringData.map(async (entry) => {
      const company = await prisma.company.findUnique({
        where: { id: entry.company_id },
        select: { id: true, name: true },
      });

      const totalApplications = await prisma.application.count({
        where: { jobPost: { company_id: entry.company_id } },
      });

      return {
        id: company?.id ?? 0,
        name: DOMPurify.sanitize(company?.name || "Unknown"), // sanitize
        jobPostsCount: entry._count.id,
        totalApplications,
      };
    })
  );

  // --- Success Rate by Department ---
  const departmentSuccessRate = await Promise.all(
    ["Software and Knowledge Engineering (SKE)", "Computer Engineering (CPE)"].map(async (faculty) => {
      const totalStudents = await prisma.student.count({ where: { faculty } });
      const acceptedApplications = await prisma.application.count({
        where: { student: { faculty }, status: 4 }, // 4 = Offered
      });

      return {
        faculty: DOMPurify.sanitize(faculty), // sanitize
        totalStudents,
        acceptedApplications,
        successRate:
          totalStudents > 0
            ? (acceptedApplications / totalStudents) * 100
            : 0,
      };
    })
  );

  // --- Process Recent Reports ---
  const processedRecentReports = recentReports.map((report) => ({
    id: report.id,
    type: report.target_type,
    createdAt: report.created_at,
    reporterEmail: DOMPurify.sanitize(report.account.email), // sanitize
  }));

  // --- Final Return Object ---
  return {
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
        2,
    },
    topHiringCompanies,
    successRateByDepartment: departmentSuccessRate,
    topSkills: topSkills.map((skill) => ({
      name: DOMPurify.sanitize(skill.name), // sanitize
      count: skill._count?.posts || 0,
    })),
    recentReports: processedRecentReports,
  };
}
