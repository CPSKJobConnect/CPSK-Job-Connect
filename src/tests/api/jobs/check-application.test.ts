/**
 * Tests for Check Job Application API
 *
 * Endpoint:
 * - POST /api/jobs/check-application - Check if student applied to job
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/jobs/check-application/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

import { mockStudent, mockStudentSession } from "@/tests/fixtures";
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    application: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
  NextRequest: jest.requireActual("next/server").NextRequest,
}));

silenceConsole();

// ============================================================================
// POST /api/jobs/check-application
// ============================================================================

describe("POST /api/jobs/check-application", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "student@ku.th" },
      });

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("Input Validation", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    });

    it("returns 400 if jobId is missing", async () => {
      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Missing job ID");
    });

    it("returns 400 if jobId is null", async () => {
      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: null }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Missing job ID");
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS
  // ==========================================================================

  describe("Authorization", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    });

    it("returns 404 if student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Application Check", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    });

    it("returns true if student has applied", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
      });

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.applied).toBe(true);
    });

    it("returns false if student has not applied", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.applied).toBe(false);
    });

    it("checks correct student and job combination", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 5 }),
      });
      await POST(req);

      expect(prisma.application.findFirst).toHaveBeenCalledWith({
        where: {
          student_id: mockStudent.id,
          job_post_id: 5,
        },
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    });

    it("handles database errors gracefully", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to check application");
    });

    it("does not expose internal error details", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal server details")
      );

      const req = new NextRequest("http://localhost/api/jobs/check-application", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.error).toBe("Failed to check application");
      expect(data.error).not.toContain("Internal");
      expect(data).not.toHaveProperty("stack");
    });
  });
});
