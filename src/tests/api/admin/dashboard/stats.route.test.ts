/**
 * Tests for GET /api/admin/dashboard/stats
 * Tests dashboard statistics retrieval with proper authentication
 */

import { GET } from "@/app/api/admin/dashboard/stats/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";

// Mock prisma
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

// Mock NextAuth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock Next Response
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
jest.spyOn(console, "error").mockImplementation(() => {});

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("returns 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 if user is not admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com", role: "student" },
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  // Note: Stats calculation logic is tested in stats.logic.test.ts
  // This route test focuses on authentication and authorization
  // Full integration tests would require database connection
});
