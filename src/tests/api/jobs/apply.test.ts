/**
 * Tests for Job Application API
 *
 * Endpoint:
 * - POST /api/jobs/apply - Apply for a job
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/jobs/apply/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";

// Import fixtures
import { mockStudentSession, mockStudent, createMockStudent } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/uploadDocument");
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    jobPost: {
      findUnique: jest.fn(),
    },
    application: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

// Silence console logs
silenceConsole();

// ============================================================================
// POST /api/jobs/apply
// ============================================================================

describe("POST /api/jobs/apply", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // Helper to create FormData
  const createApplicationFormData = (overrides: Record<string, any> = {}) => {
    const formData = new FormData();
    formData.append("jobId", overrides.jobId || "1");

    if (overrides.resumeId) formData.append("resumeId", overrides.resumeId);
    if (overrides.cvId) formData.append("cvId", overrides.cvId);
    if (overrides.portfolioId) formData.append("portfolioId", overrides.portfolioId);
    if (overrides.transcriptId) formData.append("transcriptId", overrides.transcriptId);

    if (overrides.resume) formData.append("resume", overrides.resume);
    if (overrides.cv) formData.append("cv", overrides.cv);
    if (overrides.portfolio) formData.append("portfolio", overrides.portfolio);
    if (overrides.transcript) formData.append("transcript", overrides.transcript);

    return formData;
  };

  // Helper to create mock file
  const createMockFile = (name: string = "test.pdf") => {
    const blob = new Blob(["test content"], { type: "application/pdf" });
    return new File([blob], name, { type: "application/pdf" });
  };

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@ku.th" }
      });

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
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
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        email_verified: true,
        student_status: "CURRENT",
      });
    });

    it("returns 400 if jobId is missing", async () => {
      const formData = new FormData();
      // No jobId

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Job ID is required");
    });

    it("returns 400 if jobId is invalid", async () => {
      const formData = new FormData();
      formData.append("jobId", "invalid");

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
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

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });

    it("returns 403 if current student email is not verified", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        email_verified: false,
        student_status: "CURRENT",
      });

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Email verification required");
      expect(data.requiresVerification).toBe(true);
    });

    it("returns 403 if alumni is not approved", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        student_status: "ALUMNI",
        verification_status: "PENDING",
      });

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.message).toContain("pending admin approval");
    });

    it("returns 403 if alumni is rejected", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        student_status: "ALUMNI",
        verification_status: "REJECTED",
      });

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.message).toContain("rejected");
    });
  });

  // ==========================================================================
  // BUSINESS LOGIC TESTS
  // ==========================================================================

  describe("Job Application", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        email_verified: true,
        student_status: "CURRENT",
      });
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        jobName: "Software Engineer",
        company_id: 1,
        company: {
          registration_status: "APPROVED",
        },
      });
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.application.create as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
        jobPost: {
          id: 1,
          jobName: "Software Engineer",
          company: {
            account_id: 1,
          },
        },
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 1 });
    });

    it("applies with existing document IDs successfully", async () => {
      const formData = createApplicationFormData({
        resumeId: "1",
        cvId: "2",
        portfolioId: "3",
        transcriptId: "4",
      });

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.application.create).toHaveBeenCalled();
    });

    it("uploads new documents and applies successfully", async () => {
      (uploadDocument as jest.Mock).mockResolvedValue({ id: 1 });

      const formData = createApplicationFormData({
        resume: createMockFile("resume.pdf"),
        cv: createMockFile("cv.pdf"),
      });

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(uploadDocument).toHaveBeenCalled();
      expect(prisma.application.create).toHaveBeenCalled();
    });

    it("returns 400 if job does not exist", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 400 if already applied", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        student_id: 1,
        job_post_id: 1,
      });

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("You have already applied to this job");
    });

    it("creates notification for company", async () => {
      const formData = createApplicationFormData({
        resumeId: "1",
      });

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      await POST(req);

      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudent,
        email_verified: true,
        student_status: "CURRENT",
      });
    });

    it("handles database errors gracefully", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to apply to job");
    });

    it("handles document upload errors", async () => {
      (uploadDocument as jest.Mock).mockRejectedValue(new Error("Upload failed"));
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        company: { registration_status: "APPROVED" },
      });

      const formData = createApplicationFormData({
        resume: createMockFile("resume.pdf"),
      });

      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
    });

    it("does not expose internal error details", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal server error with sensitive data")
      );

      const formData = createApplicationFormData();
      const req = new NextRequest("http://localhost/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(data.error).toBe("Failed to apply to job");
      expect(data.error).not.toContain("sensitive");
      expect(data).not.toHaveProperty("stack");
    });
  });
});
