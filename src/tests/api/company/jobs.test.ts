/**
 * Tests for Company Jobs API
 * GET /api/company/jobs - Fetch company's job posts
 */

import { GET } from "@/app/api/company/jobs/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";

// Mock modules
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    jobPost: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
}));

// Silence console logs
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("GET /api/company/jobs", () => {
  const mockCompany = {
    id: 1,
    account_id: 1,
    name: "Tech Corp",
  };

  const mockJobs = [
    {
      id: 1,
      jobName: "Senior Developer",
      location: "Bangkok",
      created_at: new Date("2024-01-01"),
      min_salary: 50000,
      max_salary: 80000,
      deadline: new Date("2026-12-31"), // Future date
      is_Published: true,
      aboutRole: "Great opportunity",
      responsibilities: "Develop software",
      requirements: ["3+ years experience"],
      qualifications: ["Bachelor's degree"],
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
      tags: [{ name: "JavaScript" }, { name: "React" }],
      applications: [{}, {}], // 2 applications
    },
    {
      id: 2,
      jobName: "Junior Designer",
      location: "Remote",
      created_at: new Date("2024-02-01"),
      min_salary: 30000,
      max_salary: 50000,
      deadline: new Date("2023-01-01"), // Expired
      is_Published: true,
      aboutRole: "Design position",
      responsibilities: "Create designs",
      requirements: ["1+ years experience"],
      qualifications: ["Portfolio required"],
      company: {
        name: "Tech Corp",
        account: {
          logoUrl: "https://example.com/logo.png",
          backgroundUrl: null,
        },
      },
      category: { name: "Design" },
      jobType: { name: "Part-time" },
      jobArrangement: { name: "Remote" },
      tags: [{ name: "Figma" }],
      applications: [{}], // 1 application
    },
    {
      id: 3,
      jobName: "Marketing Manager",
      location: "Chiang Mai",
      created_at: new Date("2024-03-01"),
      min_salary: 40000,
      max_salary: 60000,
      deadline: new Date("2026-12-31"), // Future date
      is_Published: false, // Draft
      aboutRole: null,
      responsibilities: null,
      requirements: [],
      qualifications: [],
      company: {
        name: "Tech Corp",
        account: {
          logoUrl: null,
          backgroundUrl: null,
        },
      },
      category: { name: "Marketing" },
      jobType: { name: "Full-time" },
      jobArrangement: { name: "Hybrid" },
      tags: [],
      applications: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 if company not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "company@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  describe("Jobs Retrieval", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "company@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);
    });

    it("fetches all jobs for company", async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
    });

    it("maps job data correctly", async () => {
      const res = await GET();
      const data = await res.json();

      const job = data[0];
      expect(job.id).toBe(1);
      expect(job.title).toBe("Senior Developer");
      expect(job.companyName).toBe("Tech Corp");
      expect(job.location).toBe("Bangkok");
      expect(job.salary).toEqual({ min: 50000, max: 80000 });
    });

    it("includes job type and arrangement", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].type).toBe("Full-time");
      expect(data[0].arrangement).toBe("On-site");
      expect(data[1].type).toBe("Part-time");
      expect(data[1].arrangement).toBe("Remote");
    });

    it("includes skills/tags", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].skills).toEqual(["JavaScript", "React"]);
      expect(data[1].skills).toEqual(["Figma"]);
      expect(data[2].skills).toEqual([]);
    });

    it("includes application count", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].applied).toBe(2);
      expect(data[1].applied).toBe(1);
      expect(data[2].applied).toBe(0);
    });

    it("sets status based on publication and deadline", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].status).toBe("active"); // Published, not expired
      expect(data[1].status).toBe("expire"); // Published but expired
      expect(data[2].status).toBe("draft"); // Not published
    });

    it("includes job description fields", async () => {
      const res = await GET();
      const data = await res.json();

      const job = data[0];
      expect(job.description.overview).toBe("Great opportunity");
      expect(job.description.responsibility).toBe("Develop software");
      expect(job.description.requirement).toBe("3+ years experience");
    });

    it("handles null/empty description fields", async () => {
      const res = await GET();
      const data = await res.json();

      const job = data[2];
      expect(job.description.overview).toBe("");
      expect(job.description.responsibility).toBe("-");
    });

    it("orders jobs by creation date descending", async () => {
      const res = await GET();

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: "desc" },
        })
      );
    });
  });

  describe("Company Logo and Background", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "company@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);
    });

    it("uses company logo when available", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].companyLogo).toBe("https://example.com/logo.png");
    });

    it("uses default logo when not available", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[2].companyLogo).toBe("/default-logo.png");
    });

    it("uses company background when available", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[0].companyBg).toBe("https://example.com/bg.png");
    });

    it("uses default background when not available", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data[1].companyBg).toBe("/default-bg.png");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "company@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    });

    it("handles database errors gracefully", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch jobs");
    });
  });

  describe("Empty Results", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "company@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    });

    it("returns empty array when company has no jobs", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });
  });
});
