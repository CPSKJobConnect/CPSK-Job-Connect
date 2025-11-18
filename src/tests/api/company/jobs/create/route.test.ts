import { POST } from "@/app/api/company/jobs/create/route";
import { prisma } from "@/lib/db";
import { mockCompanySession, mockStudentSession } from "@/tests/fixtures/sessions";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    jobArrangement: {
      findUnique: jest.fn(),
    },
    jobType: {
      findUnique: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    jobTag: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    documentType: {
      findMany: jest.fn(),
    },
    jobCategory: {
      findUnique: jest.fn(),
    },
    jobPost: {
      create: jest.fn(),
    },
  },
}));

const { getApiSession } = require("@/lib/api-auth");

describe("POST /api/company/jobs/create", () => {
  const mockJobArrangement = { id: 1, name: "Remote" };
  const mockJobType = { id: 2, name: "Full-time" };
  const mockCompanyAccount = {
    id: 10,
    company: {
      id: 5,
      registration_status: "APPROVED",
    },
  };
  const mockCategory = { id: 3, name: "Engineering" };
  const mockTags = [
    { id: 1, name: "JavaScript" },
    { id: 2, name: "React" },
  ];
  const mockDocTypes = [
    { id: 1, name: "Resume" },
    { id: 2, name: "CV" },
  ];

  const validJobData = {
    title: "Software Engineer",
    location: "Bangkok",
    arrangement: "Remote",
    type: "Full-time",
    salary: {
      min: 50000,
      max: 80000,
    },
    description: {
      overview: "Great role",
      responsibility: "Code and test",
      requirement: "React, Node.js",
      qualification: "Bachelor's degree",
    },
    skills: ["JavaScript", "React"],
    requiredDocuments: ["Resume", "CV"],
    category: "Engineering",
    deadline: "2025-12-31",
    is_published: true,
  };

  const setupJobTagLookup = (availableTags = mockTags) => {
    let nextTagId = availableTags.length + 1;
    (prisma.jobTag.findFirst as jest.Mock).mockImplementation(
      async ({ where }: { where: { name: string } }) =>
        availableTags.find((tag) => tag.name === where?.name) ?? null
    );
    (prisma.jobTag.create as jest.Mock).mockImplementation(
      async ({ data }: { data: { name: string } }) => ({
        id: nextTagId++,
        name: data.name,
      })
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupJobTagLookup();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getApiSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockCompanySession);
    });

    it("should return 400 if job arrangement not found", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Job arrangement not found");
    });

    it("should return 400 if job type not found", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Job type not found");
    });

    it("should return 400 if company not found", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(mockJobType);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Company not found for this account");
    });

    it("should return 403 if company not verified", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(mockJobType);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        company: {
          id: 5,
          registration_status: "PENDING",
        },
      });

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("company must be verified");
    });

    it("should return 400 if category not found", async () => {
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(mockJobType);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockCompanyAccount);
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue(mockDocTypes);
      (prisma.jobCategory.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Category not found");
    });
  });

  describe("Job Creation", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockCompanySession);
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(mockJobType);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockCompanyAccount);
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue(mockDocTypes);
      (prisma.jobCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      setupJobTagLookup();
    });

    it("should create job successfully", async () => {
      const mockCreatedJob = {
        id: 1,
        jobName: "Software Engineer",
        company_id: 5,
      };
      (prisma.jobPost.create as jest.Mock).mockResolvedValue(mockCreatedJob);

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(1);
    });

    it("should create job with correct data", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          company_id: 5,
          jobName: "Software Engineer",
          location: "Bangkok",
          min_salary: 50000,
          max_salary: 80000,
          job_type_id: 2,
          job_arrangement_id: 1,
          job_category_id: 3,
          is_Published: true,
        }),
      });
    });

    it("should connect tags correctly", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              connect: [{ id: 1 }, { id: 2 }],
            },
          }),
        })
      );
    });

    it("should connect documents correctly", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: {
              connect: [{ id: 1 }, { id: 2 }],
            },
          }),
        })
      );
    });

    it("should parse requirements correctly", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requirements: ["React", "Node.js"],
            qualifications: ["Bachelor's degree"],
          }),
        })
      );
    });

    it("should handle job without category", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });
      const jobDataWithoutCategory = { ...validJobData, category: null };

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobDataWithoutCategory),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            job_category_id: null,
          }),
        })
      );
    });

    it("should handle job without tags", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });
      const jobDataWithoutTags = { ...validJobData, skills: [] };

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobDataWithoutTags),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: undefined,
          }),
        })
      );
    });

    it("should handle job without required documents", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });
      const jobDataWithoutDocs = { ...validJobData, requiredDocuments: [] };

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobDataWithoutDocs),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: undefined,
          }),
        })
      );
    });

    it("should default to published if is_published not provided", async () => {
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });
      const { is_published, ...jobDataWithoutPublished } = validJobData;

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobDataWithoutPublished),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            is_Published: true,
          }),
        })
      );
    });

    it("should handle database errors", async () => {
      (prisma.jobPost.create as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(validJobData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });

  describe("Document Type Matching", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockCompanySession);
      (prisma.jobArrangement.findUnique as jest.Mock).mockResolvedValue(mockJobArrangement);
      (prisma.jobType.findUnique as jest.Mock).mockResolvedValue(mockJobType);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockCompanyAccount);
      (prisma.jobCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.jobPost.create as jest.Mock).mockResolvedValue({ id: 1 });
      setupJobTagLookup();
    });

    it("should match document types case-insensitively", async () => {
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Resume" },
        { id: 2, name: "CV" },
      ]);

      const jobData = {
        ...validJobData,
        requiredDocuments: ["resume", "cv"], // lowercase
      };

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: {
              connect: expect.arrayContaining([{ id: 1 }, { id: 2 }]),
            },
          }),
        })
      );
    });

    it("should match document types ignoring whitespace", async () => {
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: "Resume" },
        { id: 2, name: "Cover Letter" },
      ]);

      const jobData = {
        ...validJobData,
        requiredDocuments: ["resume", "coverletter"], // no space
      };

      const request = new Request("http://localhost/api/company/jobs/create", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
      await POST(request);

      expect(prisma.jobPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: {
              connect: expect.arrayContaining([{ id: 1 }, { id: 2 }]),
            },
          }),
        })
      );
    });
  });
});
