/**
 * API Tests: Company Application Status Update
 *
 * Endpoint:
 * - PATCH /api/company/applications/[id] - Update application status
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control (IDOR prevention)
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection
 */

import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/company/applications/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

// Import fixtures
import { mockCompanySession, mockCompany, mockApplication, mockJobPost, mockStudent } from "@/tests/fixtures";

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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    applicationStatus: {
      findFirst: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

silenceConsole();

// ============================================================================
// PATCH /api/company/applications/[id]
// ============================================================================

describe("PATCH /api/company/applications/[id]", () => {
  const mockApplicationWithDetails = {
    ...mockApplication,
    jobPost: {
      id: 1,
      jobName: "Software Engineer",
      company_id: 1,
    },
    student: {
      ...mockStudent,
      account: {
        id: 1,
        email: "student@ku.th",
      },
    },
  };

  const mockUpdatedApplication = {
    id: 1,
    status: 2,
    updated_at: new Date("2024-01-15"),
    applicationStatus: {
      name: "Accepted",
    },
    jobPost: {
      jobName: "Software Engineer",
    },
    student: {
      account: {
        id: 1,
      },
    },
  };

  beforeEach(() => {
    resetAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(mockCompanySession);
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
  });

  // ============================================
  // Authentication Tests (ASVS V2)
  // ============================================

  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns 403 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("No company found");
    });
  });

  // ============================================
  // Authorization Tests (ASVS V4 - IDOR Prevention)
  // ============================================

  describe("Authorization & IDOR Prevention", () => {
    beforeEach(() => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplicationWithDetails);
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: "accepted" });
    });

    it("returns 403 when company doesn't own the job", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue({
        ...mockApplicationWithDetails,
        jobPost: {
          ...mockApplicationWithDetails.jobPost,
          company_id: 999, // Different company
        },
      });

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("do not have permission");
    });

    it("allows company to update their own job's application", async () => {
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // Input Validation Tests (ASVS V5)
  // ============================================

  describe("Input Validation", () => {
    it("returns 400 for invalid application ID", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/invalid", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "invalid" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid application ID");
    });

    it("returns 400 for empty request body", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: "",
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("empty");
    });

    it("returns 400 for invalid JSON", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: "{ invalid json",
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid JSON");
    });

    it("returns 400 when status is missing", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Status is required");
    });

    it("returns 400 when status is not a string", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: 123 }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("must be a string");
    });

    it("returns 400 for invalid status value", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplicationWithDetails);
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "invalid_status" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid status");
    });
  });

  // ============================================
  // Success Cases
  // ============================================

  describe("Success Cases", () => {
    beforeEach(() => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplicationWithDetails);
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: "accepted" });
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
    });

    it("updates application status successfully", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("id", 1);
      expect(data.data).toHaveProperty("status", "accepted");
      expect(data.data).toHaveProperty("updated_at");
    });

    it("creates notification for student", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          account_id: 1,
          sender_id: 2,
          message: expect.stringContaining("Software Engineer"),
        }),
      });
    });

    it("handles case-insensitive status matching", async () => {
      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
      expect(prisma.applicationStatus.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: "ACCEPTED", mode: "insensitive" } },
      });
    });

    it("updates to rejected status", async () => {
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue({ id: 3, name: "rejected" });
      (prisma.application.update as jest.Mock).mockResolvedValue({
        ...mockUpdatedApplication,
        applicationStatus: { name: "Rejected" },
      });

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.status).toBe("rejected");
    });
  });

  // ============================================
  // Error Handling Tests (ASVS V7)
  // ============================================

  describe("Error Handling", () => {
    it("returns 404 when application not found", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/company/applications/999", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("handles database errors gracefully", async () => {
      (prisma.application.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles update errors gracefully", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplicationWithDetails);
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: "accepted" });
      (prisma.application.update as jest.Mock).mockRejectedValue(new Error("Update failed"));

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe("Performance", () => {
    beforeEach(() => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplicationWithDetails);
      (prisma.applicationStatus.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: "accepted" });
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
    });

    it("responds within acceptable time", async () => {
      const startTime = Date.now();

      const req = new NextRequest("http://localhost/api/company/applications/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
