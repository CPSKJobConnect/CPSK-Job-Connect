/**
 * Tests for Admin Dashboard Statistics Route
 *
 * Endpoint:
 * - GET /api/admin/dashboard/stats - Fetch dashboard statistics
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control (Admin-only)
 *
 * Note: Business logic testing is in stats.logic.test.ts
 * This file focuses on route-level concerns (auth, authorization)
 */

import { GET } from "@/app/api/admin/dashboard/stats/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";

// Import fixtures
import { mockAdminSession, mockStudentSession } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    jobPost: {
      count: jest.fn(),
      aggregate: jest.fn(),
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

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      body,
      status: opts?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}));

// Silence console logs
silenceConsole();

// ============================================================================
// GET /api/admin/dashboard/stats
// ============================================================================

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS
  // ==========================================================================

  describe("Authorization", () => {
    it("returns 403 if user is not admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockStudentSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });

    it("returns 403 for company users", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com", role: "company" },
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });

    it("allows access for admin users", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);

      // Mock all required database calls to return minimal data
      (prisma.company.count as jest.Mock).mockResolvedValue(0);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(0);
      (prisma.student.count as jest.Mock).mockResolvedValue(0);
      (prisma.report.count as jest.Mock).mockResolvedValue(0);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);
      (prisma.jobPost.aggregate as jest.Mock).mockResolvedValue({ _avg: { min_salary: 0 } });
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const res = await GET();

      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });
  });

  // ==========================================================================
  // NOTE ON BUSINESS LOGIC TESTING
  // ==========================================================================

  /*
   * Business Logic Tests:
   *
   * The actual statistics calculation logic is tested in:
   * - stats.logic.test.ts (unit tests for getDashboardStats function)
   *
   * This route test file focuses on:
   * - Authentication (401 for unauthenticated)
   * - Authorization (403 for non-admin users)
   * - Route-level concerns
   *
   * Full integration tests with real data would require:
   * - Test database connection
   * - Seeded test data
   * - Integration test suite (future enhancement)
   */
});
