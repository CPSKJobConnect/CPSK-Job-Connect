/**
 * Tests for Dashboard Statistics Business Logic
 *
 * Function: getDashboardStats
 * Tests the pure business logic for calculating dashboard statistics
 *
 * Note: Route-level testing (auth, HTTP) is in stats.route.test.ts
 */

import { getDashboardStats } from "@/app/api/admin/dashboard/stats/stats.logic";
import { prisma } from "@/lib/db";

// Import mocks
import { resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    jobPost: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    student: {
      count: jest.fn(),
    },
    report: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    jobTag: {
      findMany: jest.fn(),
    },
    application: {
      count: jest.fn(),
    },
  },
}));

// ============================================================================
// BUSINESS LOGIC TESTS
// ============================================================================

describe("getDashboardStats", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("returns correct stats with mocked data", async () => {
    // Arrange - Mock Prisma responses
    (prisma.company.count as jest.Mock)
      .mockResolvedValueOnce(2) // pendingCompanies
      .mockResolvedValueOnce(10); // totalCompanies

    (prisma.jobPost.count as jest.Mock).mockResolvedValue(15);
    (prisma.student.count as jest.Mock).mockResolvedValue(50);
    (prisma.report.count as jest.Mock).mockResolvedValue(3);

    (prisma.jobPost.aggregate as jest.Mock).mockResolvedValue({
      _avg: { min_salary: 20000, max_salary: 40000 },
    });

    (prisma.jobPost.groupBy as jest.Mock).mockResolvedValue([
      { company_id: 1, _count: { id: 5 } },
    ]);

    (prisma.company.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Tech Corp",
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

    // Act - Run the function
    const stats = await getDashboardStats();

    // Assert - Verify calculations
    expect(stats.totalStudents).toBe(50);
    expect(stats.totalJobPosts).toBe(15);
    expect(stats.averageSalary.overall).toBe(30000);
    expect(stats.topHiringCompanies.length).toBe(1);
    expect(stats.topSkills[0].name).toBe("React");
    expect(stats.recentReports[0].reporterEmail).toBe("reporter@example.com");
  });

  it("handles zero companies correctly", async () => {
    (prisma.company.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
    (prisma.student.count as jest.Mock).mockResolvedValue(0);
    (prisma.report.count as jest.Mock).mockResolvedValue(0);
    (prisma.jobPost.aggregate as jest.Mock).mockResolvedValue({
      _avg: { min_salary: null, max_salary: null },
    });
    (prisma.jobPost.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.company.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.application.count as jest.Mock).mockResolvedValue(0);

    const stats = await getDashboardStats();

    expect(stats.totalStudents).toBe(0);
    expect(stats.totalJobPosts).toBe(0);
    expect(stats.topHiringCompanies).toEqual([]);
  });

  it("handles null salary averages", async () => {
    (prisma.company.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(5);
    (prisma.jobPost.count as jest.Mock).mockResolvedValue(10);
    (prisma.student.count as jest.Mock).mockResolvedValue(20);
    (prisma.report.count as jest.Mock).mockResolvedValue(1);
    (prisma.jobPost.aggregate as jest.Mock).mockResolvedValue({
      _avg: { min_salary: null, max_salary: null },
    });
    (prisma.jobPost.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.company.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.application.count as jest.Mock).mockResolvedValue(5);

    const stats = await getDashboardStats();

    expect(stats.averageSalary.min).toBe(0);
    expect(stats.averageSalary.max).toBe(0);
    expect(stats.averageSalary.overall).toBe(0);
  });
});
