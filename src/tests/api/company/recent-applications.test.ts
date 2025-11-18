/**
 * API Tests: Company Recent Applications
 *
 * Endpoint:
 * - GET /api/company/recent-applications - Get recent applications with pagination
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/company/recent-applications/route";
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
// GET /api/company/recent-applications
// ============================================================================

describe("GET /api/company/recent-applications", () => {
  const mockApplications = [
    {
      id: 1,
      applied_at: new Date("2024-01-15T10:00:00Z"),
      student: {
        id: 1,
        name: "John Doe",
        account: {
          id: 1,
          email: "john@ku.th",
          logoUrl: "https://example.com/john.jpg",
        },
      },
      jobPost: {
        id: 1,
        jobName: "Software Engineer",
      },
      applicationStatus: {
        name: "Pending",
      },
    },
    {
      id: 2,
      applied_at: new Date("2024-01-14T09:00:00Z"),
      student: {
        id: 2,
        name: "Jane Smith",
        account: {
          id: 2,
          email: "jane@ku.th",
          logoUrl: null,
        },
      },
      jobPost: {
        id: 2,
        jobName: "Product Manager",
      },
      applicationStatus: {
        name: "Reviewed",
      },
    },
  ];

  beforeEach(() => {
    resetAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(mockCompanySession);
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    (prisma.application.count as jest.Mock).mockResolvedValue(10);
    (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 403 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/recent-applications");
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
    it("returns applications with default pagination", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("applications");
      expect(data.data).toHaveProperty("total", 10);
      expect(data.data).toHaveProperty("limit", 5);
      expect(data.data).toHaveProperty("offset", 0);
    });

    it("formats application data correctly", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.applications[0]).toEqual({
        id: 1,
        applicant: {
          id: 1,
          name: "John Doe",
          email: "john@ku.th",
          profile_url: "https://example.com/john.jpg",
        },
        job: {
          id: 1,
          title: "Software Engineer",
        },
        status: "pending",
        applied_at: "2024-01-15T10:00:00.000Z",
      });
    });

    it("handles null profile URLs", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.applications[1].applicant.profile_url).toBeNull();
    });

    it("converts status to lowercase", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.applications[0].status).toBe("pending");
      expect(data.data.applications[1].status).toBe("reviewed");
    });

    it("respects custom limit parameter", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications?limit=10");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it("respects custom offset parameter", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications?offset=20");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
        })
      );
    });

    it("respects both limit and offset parameters", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications?limit=15&offset=30");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.limit).toBe(15);
      expect(data.data.offset).toBe(30);
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 15,
          skip: 30,
        })
      );
    });

    it("orders applications by applied_at descending", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            applied_at: "desc",
          },
        })
      );
    });

    it("filters applications by company ID", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            jobPost: { company_id: 1 },
          },
        })
      );

      expect(prisma.application.count).toHaveBeenCalledWith({
        where: {
          jobPost: { company_id: 1 },
        },
      });
    });

    it("includes required relations", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      await GET(req);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            student: expect.objectContaining({
              include: expect.objectContaining({
                account: expect.any(Object),
              }),
            }),
            jobPost: expect.any(Object),
            applicationStatus: expect.any(Object),
          }),
        })
      );
    });

    it("handles empty results", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.applications).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    it("returns total count correctly", async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(47);

      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(data.data.total).toBe(47);
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================

  describe("Pagination", () => {
    it("supports pagination through multiple pages", async () => {
      // Page 1
      const req1 = new NextRequest("http://localhost/api/company/recent-applications?limit=5&offset=0");
      const res1 = await GET(req1);
      const data1 = await res1.json();

      expect(data1.data.limit).toBe(5);
      expect(data1.data.offset).toBe(0);

      // Page 2
      const req2 = new NextRequest("http://localhost/api/company/recent-applications?limit=5&offset=5");
      const res2 = await GET(req2);
      const data2 = await res2.json();

      expect(data2.data.limit).toBe(5);
      expect(data2.data.offset).toBe(5);
    });

    it("handles offset beyond total count", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(10);

      const req = new NextRequest("http://localhost/api/company/recent-applications?offset=100");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.applications).toEqual([]);
      expect(data.data.total).toBe(10);
    });

    it("handles non-numeric limit gracefully", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications?limit=abc");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: NaN, // parseInt("abc") returns NaN
        })
      );
    });

    it("handles non-numeric offset gracefully", async () => {
      const req = new NextRequest("http://localhost/api/company/recent-applications?offset=xyz");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: NaN,
        })
      );
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.application.count as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles findMany errors gracefully", async () => {
      (prisma.application.findMany as jest.Mock).mockRejectedValue(new Error("Query failed"));

      const req = new NextRequest("http://localhost/api/company/recent-applications");
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
    it("responds within acceptable time", async () => {
      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/recent-applications");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("handles large pagination efficiently", async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockApplications[0],
        id: i + 1,
      }));
      (prisma.application.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const req = new NextRequest("http://localhost/api/company/recent-applications?limit=100");
      const res = await GET(req);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
