/**
 * Tests for Individual Job API
 *
 * Endpoints:
 * - GET /api/jobs/[id] - Fetch job details
 * - DELETE /api/jobs/[id] - Delete job post
 * - PATCH /api/jobs/[id] - Update job post
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control & Authorization
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection & IDOR Prevention
 */

import { NextRequest } from "next/server";
import { GET, DELETE, PATCH } from "@/app/api/jobs/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

import { mockJobPost, mockCompany, createMockCompanySession } from "@/tests/fixtures";
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// Create company session with ID matching the test data
const mockCompanySessionWithId1 = createMockCompanySession({
  user: {
    id: "1",
    email: "company@example.com",
    role: "company",
    name: "Tech Corp",
  },
});

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    jobPost: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jobArrangement: {
      findUnique: jest.fn(),
    },
    jobType: {
      findUnique: jest.fn(),
    },
    jobTag: {
      findMany: jest.fn(),
    },
    documentType: {
      findMany: jest.fn(),
    },
    jobCategory: {
      findUnique: jest.fn(),
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
// GET /api/jobs/[id]
// ============================================================================

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  const mockJobData = {
    id: 1,
    jobName: "Software Engineer",
    location: "Bangkok",
    min_salary: 50000,
    max_salary: 80000,
    aboutRole: "Exciting role",
    responsibilities: "Write code",
    requirements: ["3+ years experience"],
    qualifications: ["Bachelor degree"],
    deadline: new Date("2026-12-31"),
    is_Published: true,
    created_at: new Date("2024-01-01"),
    company: {
      id: 1,
      name: "Tech Corp",
      account: {
        logoUrl: "https://example.com/logo.png",
        backgroundUrl: "https://example.com/bg.png",
      },
    },
    category: { name: "Engineering" },
    jobType: { name: "Full-time" },
    jobArrangement: { name: "On-site" },
    tags: [{ name: "TypeScript" }, { name: "React" }],
    applications: [{}, {}],
    documents: [{ name: "Resume" }, { name: "CV" }],
  };

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Job Retrieval", () => {
    it("fetches job by ID successfully", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.title).toBe("Software Engineer");
    });

    it("maps job data correctly", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data).toHaveProperty("companyLogo");
      expect(data).toHaveProperty("companyBg");
      expect(data).toHaveProperty("companyName");
      expect(data).toHaveProperty("salary");
      expect(data.salary.min).toBe(50000);
      expect(data.salary.max).toBe(80000);
    });

    it("includes job description fields", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.description).toHaveProperty("overview");
      expect(data.description).toHaveProperty("responsibility");
      expect(data.description).toHaveProperty("requirement");
      expect(data.description).toHaveProperty("qualification");
    });

    it("calculates status as active for published job", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.status).toBe("active");
    });

    it("calculates status as draft for unpublished job", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockJobData,
        is_Published: false,
      });

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.status).toBe("draft");
    });

    it("calculates status as expire for past deadline", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockJobData,
        deadline: new Date("2020-01-01"),
      });

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.status).toBe("expire");
    });

    it("includes application count", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.applied).toBe(2);
    });

    it("includes required documents", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(mockJobData);

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.documents).toEqual(["resume", "cv"]);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    it("returns 404 if job not found", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/jobs/999");
      const res = await GET(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("handles database errors gracefully", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch job");
    });

    it("does not expose internal error details", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal server details")
      );

      const req = new Request("http://localhost/api/jobs/1");
      const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.error).toBe("Failed to fetch job");
      expect(data.error).not.toContain("Internal");
      expect(data).not.toHaveProperty("stack");
    });
  });
});

// ============================================================================
// DELETE /api/jobs/[id]
// ============================================================================

describe("DELETE /api/jobs/[id]", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  const mockExistingJob = {
    id: 1,
    jobName: "Software Engineer",
    company: {
      id: 1,
      account_id: 1,
      registration_status: "APPROVED",
    },
  };

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: { email: "test@example.com" } });

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS - IDOR Prevention
  // ==========================================================================

  describe("Authorization - IDOR Prevention", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
    });

    it("returns 404 if job not found", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/999", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 403 if company does not own the job", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          ...mockExistingJob.company,
          account_id: 999, // Different company
        },
      });

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("don't own this job");
    });

    it("returns 403 if company is not verified", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          id: 1,
          account_id: 1,
          registration_status: "PENDING",
        },
      });

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("must be verified");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Job Deletion", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          id: 1,
          account_id: 1,
          registration_status: "APPROVED",
        },
      });
      (prisma.jobPost.delete as jest.Mock).mockResolvedValue({ id: 1 });
    });

    it("deletes job successfully", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("deleted successfully");
      expect(prisma.jobPost.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
    });

    it("handles database errors gracefully", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to delete job");
    });

    it("does not expose internal error details", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database details")
      );

      const req = new NextRequest("http://localhost/api/jobs/1", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.error).toBe("Failed to delete job");
      expect(data).not.toHaveProperty("stack");
    });
  });
});

// ============================================================================
// PATCH /api/jobs/[id]
// ============================================================================

describe("PATCH /api/jobs/[id]", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  const mockExistingJob = {
    id: 1,
    jobName: "Software Engineer",
    location: "Bangkok",
    min_salary: 50000,
    max_salary: 80000,
    aboutRole: "Exciting role",
    responsibilities: "Write code",
    requirements: ["3+ years"],
    qualifications: ["Bachelor"],
    deadline: new Date("2026-12-31"),
    job_arrangement_id: 1,
    job_type_id: 1,
    job_category_id: 1,
    company: {
      id: 1,
      account_id: 1,
      registration_status: "APPROVED",
    },
    tags: [{ id: 1, name: "TypeScript" }],
    category: { id: 1, name: "Engineering" },
  };

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: { email: "test@example.com" } });

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS - IDOR Prevention
  // ==========================================================================

  describe("Authorization - IDOR Prevention", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
    });

    it("returns 404 if job not found", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/999", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 403 if company does not own the job", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          ...mockExistingJob.company,
          account_id: 999,
        },
      });

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("don't own this job");
    });

    it("returns 403 if company is not verified", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          id: 1,
          account_id: 1,
          registration_status: "REJECTED",
        },
      });

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("must be verified");
    });
  });

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("Input Validation", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          id: 1,
          account_id: 1,
          registration_status: "APPROVED",
        },
      });
    });

    it("returns 400 for invalid arrangement", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ arrangement: "InvalidArrangement" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid arrangement or type");
    });

    it("returns 400 for invalid job type", async () => {
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ type: "InvalidType" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid arrangement or type");
    });

    it("returns 400 for invalid category", async () => {
      (prisma.jobCategory.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ category: "InvalidCategory" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Category not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Job Update", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingJob,
        company: {
          id: 1,
          account_id: 1,
          registration_status: "APPROVED",
        },
      });
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue({ id: 2, name: "Remote" });
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue({ id: 2, name: "Part-time" });
      (prisma.jobCategory.findUnique as jest.Mock).mockResolvedValue({ id: 2, name: "Design" });
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (prisma.jobPost.update as jest.Mock).mockResolvedValue({ id: 1, jobName: "Updated Job" });
    });

    it("updates job successfully", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({
          location: "Remote",
          min_salary: 60000,
          max_salary: 90000,
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("updated successfully");
      expect(prisma.jobPost.update).toHaveBeenCalled();
    });

    it("updates job arrangement", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ arrangement: "Remote" }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.jobArrangement.findUnique).toHaveBeenCalledWith({
        where: { name: "Remote" },
      });
    });

    it("updates job type", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ type: "Part-time" }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.jobType.findUnique).toHaveBeenCalledWith({
        where: { name: "Part-time" },
      });
    });

    it("updates job category", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ category: "Design" }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.jobCategory.findUnique).toHaveBeenCalledWith({
        where: { name: "Design" },
      });
    });

    it("updates job tags", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ tags: ["TypeScript", "React"] }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.jobTag.findMany).toHaveBeenCalledWith({
        where: { name: { in: ["TypeScript", "React"] } },
        select: { id: true },
      });
    });

    it("updates required documents", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ requiredDocuments: ["Resume"] }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.documentType.findMany).toHaveBeenCalledWith({
        where: { name: { in: ["Resume"] } },
        select: { id: true },
      });
    });

    it("preserves existing values when not updating", async () => {
      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      const updateCall = (prisma.jobPost.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.min_salary).toBe(mockExistingJob.min_salary);
      expect(updateCall.data.max_salary).toBe(mockExistingJob.max_salary);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockCompanySessionWithId1);
    });

    it("handles database errors gracefully", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update job");
    });

    it("does not expose internal error details", async () => {
      (prisma.jobPost.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database schema")
      );

      const req = new NextRequest("http://localhost/api/jobs/1", {
        method: "PATCH",
        body: JSON.stringify({ location: "Remote" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.error).toBe("Failed to update job");
      expect(data.error).not.toContain("schema");
      expect(data).not.toHaveProperty("stack");
    });
  });
});
