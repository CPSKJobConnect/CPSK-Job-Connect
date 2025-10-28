import { getDashboardStats } from "@/app/api/admin/dashboard/stats/stats.logic";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    company: { count: jest.fn(), findMany: jest.fn() },
    jobPost: { count: jest.fn(), aggregate: jest.fn() },
    student: { count: jest.fn() },
    report: { count: jest.fn(), findMany: jest.fn() },
    jobTag: { findMany: jest.fn() },
    application: { count: jest.fn() },
  },
}));

describe("getDashboardStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Returns correct stats with mocked data", async () => {
    // Mock Prisma responses
    (prisma.company.count as jest.Mock)
      .mockResolvedValueOnce(2) // pendingCompanies
      .mockResolvedValueOnce(10); // totalCompanies
    (prisma.jobPost.count as jest.Mock).mockResolvedValue(15);
    (prisma.student.count as jest.Mock).mockResolvedValue(50);
    (prisma.report.count as jest.Mock).mockResolvedValue(3);
    (prisma.jobPost.aggregate as jest.Mock).mockResolvedValue({
      _avg: { min_salary: 20000, max_salary: 40000 },
    });
    (prisma.company.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: "Tech Corp", jobPosts: [{ applications: [] }] },
    ]);
    (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([
      { name: "React", _count: { jobPosts: 5 } },
    ]);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        type: "spam",
        created_at: new Date(),
        account: { email: "reporter@example.com" },
      },
    ]);
    (prisma.application.count as jest.Mock).mockResolvedValue(20);

    const stats = await getDashboardStats();

    expect(stats.totalStudents).toBe(50);
    expect(stats.totalJobPosts).toBe(15);
    expect(stats.averageSalary.overall).toBe(30000);
    expect(stats.topHiringCompanies.length).toBe(1);
    expect(stats.topSkills[0].name).toBe("React");
    expect(stats.recentReports[0].reporterEmail).toBe("reporter@example.com");
  });
});
