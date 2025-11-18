import { GET } from "@/app/api/company/top-jobs/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

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

describe("GET /api/company/top-jobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please login.");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: {},
      });

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please login.");
    });

    it("should return 403 if company not found for account", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          email: "user@example.com",
        },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("No company found for this account.");
    });
  });

  describe("Fetching top jobs", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "company@example.com",
        role: "company",
      },
    };

    const mockCompany = {
      id: 10,
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    });

    it("should return top jobs by application count (default limit 5)", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const mockJobs = [
        {
          id: 1,
          jobName: "Software Engineer",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        {
          id: 2,
          jobName: "Designer",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 3,
          jobName: "Product Manager",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 6 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobs).toHaveLength(3);
      expect(data.data.jobs[0].applications).toBe(3); // Most applications first
      expect(data.data.jobs[1].applications).toBe(2);
      expect(data.data.jobs[2].applications).toBe(1);
    });

    it("should respect custom limit parameter", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        jobName: `Job ${i + 1}`,
        is_Published: true,
        deadline: futureDate,
        applications: Array.from({ length: 10 - i }, (_, j) => ({ id: j })),
      }));

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs?limit=3");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs).toHaveLength(3);
    });

    it("should mark draft jobs with status 'draft'", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = [
        {
          id: 1,
          jobName: "Draft Job",
          is_Published: false,
          deadline: futureDate,
          applications: [{ id: 1 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs[0].status).toBe("draft");
    });

    it("should mark closed jobs with status 'closed'", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const mockJobs = [
        {
          id: 1,
          jobName: "Expired Job",
          is_Published: true,
          deadline: pastDate,
          applications: [{ id: 1 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs[0].status).toBe("closed");
    });

    it("should mark active jobs with status 'active'", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = [
        {
          id: 1,
          jobName: "Active Job",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 1 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs[0].status).toBe("active");
    });

    it("should return job with correct structure", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = [
        {
          id: 1,
          jobName: "Software Engineer",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 1 }, { id: 2 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const job = data.data.jobs[0];
      expect(job).toHaveProperty("id");
      expect(job).toHaveProperty("title");
      expect(job).toHaveProperty("applications");
      expect(job).toHaveProperty("views");
      expect(job).toHaveProperty("status");
      expect(job.title).toBe("Software Engineer");
      expect(job.applications).toBe(2);
      expect(job.views).toBe(0); // Views is always 0 in current implementation
    });

    it("should sort jobs by application count in descending order", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = [
        {
          id: 1,
          jobName: "Job A",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 1 }],
        },
        {
          id: 2,
          jobName: "Job B",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 2 }, { id: 3 }, { id: 4 }],
        },
        {
          id: 3,
          jobName: "Job C",
          is_Published: true,
          deadline: futureDate,
          applications: [{ id: 5 }, { id: 6 }],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs[0].applications).toBe(3);
      expect(data.data.jobs[1].applications).toBe(2);
      expect(data.data.jobs[2].applications).toBe(1);
    });

    it("should handle jobs with no applications", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const mockJobs = [
        {
          id: 1,
          jobName: "Job With No Apps",
          is_Published: true,
          deadline: futureDate,
          applications: [],
        },
      ];

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.jobs[0].applications).toBe(0);
    });

    it("should return empty array when no jobs found", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobs).toEqual([]);
    });

    it("should query jobs for the authenticated company", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith({
        where: {
          company_id: 10,
        },
        include: {
          applications: {
            select: {
              id: true,
            },
          },
        },
        take: 10, // Default limit is 5, so take 5 * 2 = 10
      });
    });

    it("should take limit * 2 jobs from database", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs?limit=8");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 16, // limit * 2 = 8 * 2
        })
      );
    });
  });

  describe("Error handling", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "company@example.com",
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.company.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should handle job query errors", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: 10 });
      (prisma.jobPost.findMany as jest.Mock).mockRejectedValue(
        new Error("Job query failed")
      );

      const request = new NextRequest("http://localhost:3000/api/company/top-jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
