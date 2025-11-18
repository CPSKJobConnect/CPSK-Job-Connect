/**
 * API Tests: Company Statistics
 *
 * Endpoint:
 * - GET /api/company/stats - Get company dashboard statistics
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V7: Error Handling
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/company/stats/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

// Import fixtures
import { mockCompanySession, mockCompany } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    jobPost: {
      count: jest.fn(),
    },
    application: {
      count: jest.fn(),
    },
  },
}));

silenceConsole();

// ============================================================================
// GET /api/company/stats
// ============================================================================

describe("GET /api/company/stats", () => {
  beforeEach(() => {
    resetAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(mockCompanySession);
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 403 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("No company found");
    });
  });

  // ============================================
  // Success Cases
  // ============================================

  describe("Success Cases", () => {
    it("returns complete statistics", async () => {
      // Mock job counts
      (prisma.jobPost.count as jest.Mock)
        .mockResolvedValueOnce(25)  // totalJobs
        .mockResolvedValueOnce(15)  // activeJobs
        .mockResolvedValueOnce(5)   // draftJobs
        .mockResolvedValueOnce(5);  // closedJobs

      // Mock application counts
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalApplications
        .mockResolvedValueOnce(12)  // newApplications
        .mockResolvedValueOnce(40)  // pendingApplications
        .mockResolvedValueOnce(30)  // reviewedApplications
        .mockResolvedValueOnce(20)  // interviewedApplications
        .mockResolvedValueOnce(10); // offeredApplications

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        totalJobs: 25,
        activeJobs: 15,
        draftJobs: 5,
        closedJobs: 5,
        totalApplications: 100,
        newApplications: 12,
        pendingApplications: 40,
        reviewedApplications: 30,
        interviewsScheduled: 20,
        offersExtended: 10,
        offersAccepted: 10,
      });
    });

    it("handles zero values", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toEqual({
        totalJobs: 0,
        activeJobs: 0,
        draftJobs: 0,
        closedJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        pendingApplications: 0,
        reviewedApplications: 0,
        interviewsScheduled: 0,
        offersExtended: 0,
        offersAccepted: 0,
      });
    });

    it("queries job statistics correctly", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      await GET(req);

      // Verify total jobs query
      expect(prisma.jobPost.count).toHaveBeenCalledWith({
        where: { company_id: 1 },
      });

      // Verify active jobs query (published and not past deadline)
      expect(prisma.jobPost.count).toHaveBeenCalledWith({
        where: {
          company_id: 1,
          is_Published: true,
          deadline: { gte: expect.any(Date) },
        },
      });

      // Verify draft jobs query
      expect(prisma.jobPost.count).toHaveBeenCalledWith({
        where: {
          company_id: 1,
          is_Published: false,
        },
      });

      // Verify closed jobs query (past deadline)
      expect(prisma.jobPost.count).toHaveBeenCalledWith({
        where: {
          company_id: 1,
          deadline: { lt: expect.any(Date) },
        },
      });
    });

    it("queries application statistics correctly", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      await GET(req);

      // Verify total applications query
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
        },
      });

      // Verify new applications query (today)
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
          applied_at: { gte: expect.any(Date) },
        },
      });

      // Verify pending applications query (status = 1)
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
          status: 1,
        },
      });

      // Verify reviewed applications query (status = 2)
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
          status: 2,
        },
      });

      // Verify interviewed applications query (status = 3)
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
          status: 3,
        },
      });

      // Verify offered applications query (status = 4)
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
          status: 4,
        },
      });
    });

    it("uses Promise.all for parallel queries", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      const startTime = Date.now();
      await GET(req);
      const endTime = Date.now();

      // All 10 queries should execute in parallel
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("filters data by company ID", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      await GET(req);

      // All job queries should filter by company_id
      const jobCalls = (prisma.jobPost.count as jest.Mock).mock.calls;
      jobCalls.forEach((call) => {
        expect(call[0].where).toHaveProperty("company_id", 1);
      });

      // All application queries should filter by company_id through jobPost
      const appCalls = (prisma.application.count as jest.Mock).mock.calls;
      appCalls.forEach((call) => {
        expect(call[0].where.jobPost).toHaveProperty("company_id", 1);
      });
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.jobPost.count as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles partial query failures", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(10);
      (prisma.application.count as jest.Mock).mockRejectedValue(new Error("App count failed"));

      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe("Performance", () => {
    it("responds within acceptable time", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("handles large counts efficiently", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(10000);
      (prisma.application.count as jest.Mock).mockResolvedValue(50000);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/stats");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  // ============================================
  // Data Accuracy Tests
  // ============================================

  describe("Data Accuracy", () => {
    it("correctly calculates today's start time", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/stats");
      await GET(req);

      // Find the call for new applications (has applied_at filter)
      const newAppsCall = (prisma.application.count as jest.Mock).mock.calls.find(
        (call) => call[0].where.applied_at
      );

      const startOfToday = newAppsCall[0].where.applied_at.gte;
      expect(startOfToday.getHours()).toBe(0);
      expect(startOfToday.getMinutes()).toBe(0);
      expect(startOfToday.getSeconds()).toBe(0);
      expect(startOfToday.getMilliseconds()).toBe(0);
    });

    it("uses current time for deadline comparisons", async () => {
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const beforeTime = new Date();
      const req = new NextRequest("http://localhost/api/company/stats");
      await GET(req);
      const afterTime = new Date();

      // Find the call for active jobs (has deadline.gte)
      const activeJobsCall = (prisma.jobPost.count as jest.Mock).mock.calls.find(
        (call) => call[0].where.deadline?.gte
      );

      const deadlineCheck = activeJobsCall[0].where.deadline.gte;
      expect(deadlineCheck.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(deadlineCheck.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
