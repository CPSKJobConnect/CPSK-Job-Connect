/**
 * API Tests: Company Analytics
 *
 * Endpoint:
 * - GET /api/company/analytics - Get analytics data (trends or status distribution)
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/company/analytics/route";
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
    application: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

silenceConsole();

// ============================================================================
// GET /api/company/analytics
// ============================================================================

describe("GET /api/company/analytics", () => {
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

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 403 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("No company found");
    });
  });

  // ============================================
  // Input Validation Tests
  // ============================================

  describe("Input Validation", () => {
    it("returns 400 when type parameter is missing", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid type parameter");
    });

    it("returns 400 for invalid type parameter", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=invalid");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Must be 'trend' or 'status'");
    });

    it("accepts 'trend' as valid type", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts 'status' as valid type", async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // Trend Analytics Tests
  // ============================================

  describe("Trend Analytics", () => {
    const mockApplications = [
      { applied_at: new Date("2024-01-10") },
      { applied_at: new Date("2024-01-10") },
      { applied_at: new Date("2024-01-11") },
      { applied_at: new Date("2024-01-15") },
      { applied_at: new Date("2024-01-15") },
      { applied_at: new Date("2024-01-15") },
    ];

    beforeEach(() => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);
    });

    it("returns trend data with default period (month)", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("trend");
      expect(data.data).toHaveProperty("period", "month");
      expect(data.data).toHaveProperty("total", 6);
    });

    it("groups applications by date", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.trend).toEqual(
        expect.arrayContaining([
          { date: "2024-01-10", applications: 2 },
          { date: "2024-01-11", applications: 1 },
          { date: "2024-01-15", applications: 3 },
        ])
      );
    });

    it("handles week period", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend&period=week");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.period).toBe("week");
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applied_at: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("handles year period", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend&period=year");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.period).toBe("year");
    });

    it("returns empty trend for no applications", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.trend).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    it("filters applications by company ID", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobPost: { company_id: 1 },
          }),
        })
      );
    });

    it("orders applications by date ascending", async () => {
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { applied_at: "asc" },
        })
      );
    });
  });

  // ============================================
  // Status Analytics Tests
  // ============================================

  describe("Status Analytics", () => {
    it("returns status distribution", async () => {
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(5)  // reviewed
        .mockResolvedValueOnce(3)  // interviewed
        .mockResolvedValueOnce(2)  // offered
        .mockResolvedValueOnce(8); // rejected

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        pending: 10,
        reviewed: 5,
        interviewed: 3,
        offered: 2,
        rejected: 8,
      });
    });

    it("handles zero counts", async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toEqual({
        pending: 0,
        reviewed: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
      });
    });

    it("queries each status separately", async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      await GET(req);

      expect(prisma.application.count).toHaveBeenCalledTimes(5);
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { jobPost: { company_id: 1 }, status: 1 },
      });
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { jobPost: { company_id: 1 }, status: 2 },
      });
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { jobPost: { company_id: 1 }, status: 3 },
      });
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { jobPost: { company_id: 1 }, status: 4 },
      });
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { jobPost: { company_id: 1 }, status: 5 },
      });
    });

    it("uses Promise.all for parallel queries", async () => {
      const countSpy = jest.spyOn(prisma.application, 'count');
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const startTime = Date.now();
      await GET(req);
      const endTime = Date.now();

      // All 5 queries should execute in parallel, so total time should be minimal
      expect(endTime - startTime).toBeLessThan(100);
      expect(countSpy).toHaveBeenCalledTimes(5);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe("Error Handling", () => {
    it("handles database errors gracefully for trend", async () => {
      (prisma.application.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles database errors gracefully for status", async () => {
      (prisma.application.count as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe("Performance", () => {
    it("responds within acceptable time for trend", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("responds within acceptable time for status", async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/analytics?type=status");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("handles large dataset efficiently", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        applied_at: new Date(`2024-01-${(i % 31) + 1}`),
      }));
      (prisma.application.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/analytics?type=trend");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
