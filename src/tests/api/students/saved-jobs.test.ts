/**
 * Tests for Saved Jobs API
 *
 * Endpoints:
 * - POST /api/students/saved-jobs - Save job
 * - DELETE /api/students/saved-jobs - Unsave job
 * - GET /api/students/saved-jobs - Get saved jobs or check if job is saved
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection
 */

import { NextRequest } from "next/server";
import { POST, DELETE, GET } from "@/app/api/students/saved-jobs/route";
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
    savedJob: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
// POST /api/students/saved-jobs
// ============================================================================

describe("POST /api/students/saved-jobs", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "student@ku.th" },
      });

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
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
      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Job ID is required");
    });

    it("returns 400 if jobId is null", async () => {
      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: null }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Job ID is required");
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student profile not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Save Job", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.savedJob.create as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
      });
    });

    it("saves job successfully", async () => {
      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toBe("Job saved successfully");
      expect(prisma.savedJob.create).toHaveBeenCalledWith({
        data: {
          student_id: mockStudent.id,
          job_post_id: 1,
        },
      });
    });

    it("returns 400 if job already saved", async () => {
      (prisma.savedJob.create as jest.Mock).mockRejectedValue({
        code: "P2002",
        message: "Unique constraint failed",
      });

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Job already saved");
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to save job");
    });

    it("does not expose internal error details", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database details")
      );

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.error).not.toContain("Internal database");
      expect(data).not.toHaveProperty("stack");
    });
  });
});

// ============================================================================
// DELETE /api/students/saved-jobs
// ============================================================================

describe("DELETE /api/students/saved-jobs", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
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
      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Job ID is required");
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student profile not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Unsave Job", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.savedJob.delete as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
      });
    });

    it("unsaves job successfully", async () => {
      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe("Job unsaved successfully");
    });

    it("returns 404 if job was not saved", async () => {
      (prisma.savedJob.delete as jest.Mock).mockRejectedValue({
        code: "P2025",
        message: "Record not found",
      });

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not saved");
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId: 1 }),
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to unsave job");
    });
  });
});

// ============================================================================
// GET /api/students/saved-jobs
// ============================================================================

describe("GET /api/students/saved-jobs", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student profile not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS - Check Single Job
  // ==========================================================================

  describe("Check if Job is Saved", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    });

    it("returns true if job is saved", async () => {
      (prisma.savedJob.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
      });

      const req = new NextRequest("http://localhost/api/students/saved-jobs?jobId=1");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isSaved).toBe(true);
    });

    it("returns false if job is not saved", async () => {
      (prisma.savedJob.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/saved-jobs?jobId=1");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isSaved).toBe(false);
    });
  });

  // ==========================================================================
  // SUCCESS TESTS - Get All Saved Jobs
  // ==========================================================================

  describe("Get All Saved Jobs", () => {
    const mockSavedJobs = [
      {
        id: 1,
        student_id: 1,
        job_post_id: 1,
        created_at: new Date("2024-01-01"),
        jobPost: {
          id: 1,
          jobName: "Software Engineer",
          location: "Bangkok",
          min_salary: 50000,
          max_salary: 80000,
          aboutRole: "Exciting role",
          requirements: ["3+ years"],
          qualifications: ["Bachelor"],
          created_at: new Date("2024-01-01"),
          deadline: new Date("2026-12-31"),
          company: {
            name: "Tech Corp",
            account: {
              logoUrl: "https://example.com/logo.png",
              backgroundUrl: "https://example.com/bg.png",
            },
          },
          category: { name: "Engineering" },
          jobType: { name: "Full-time" },
          jobArrangement: { name: "On-site" },
          tags: [{ name: "TypeScript" }],
          applications: [{ id: 1 }],
          _count: { applications: 2 },
        },
      },
    ];

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.savedJob.findMany as jest.Mock).mockResolvedValue(mockSavedJobs);
    });

    it("returns all saved jobs successfully", async () => {
      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.savedJobs).toHaveLength(1);
      expect(data.savedJobs[0].job.title).toBe("Software Engineer");
    });

    it("transforms job data correctly", async () => {
      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      const job = data.savedJobs[0];
      expect(job.job).toHaveProperty("companyLogo");
      expect(job.job).toHaveProperty("salary");
      expect(job).toHaveProperty("isBookmarked");
      expect(job).toHaveProperty("isApplied");
    });

    it("returns empty array when no saved jobs", async () => {
      (prisma.savedJob.findMany as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.savedJobs).toEqual([]);
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

      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to fetch saved jobs");
    });

    it("does not expose internal error details", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database schema")
      );

      const req = new NextRequest("http://localhost/api/students/saved-jobs");
      const res = await GET(req);
      const data = await res.json();

      expect(data.error).not.toContain("schema");
      expect(data).not.toHaveProperty("stack");
    });
  });
});
