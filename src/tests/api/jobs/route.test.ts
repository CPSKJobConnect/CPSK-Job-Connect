import { GET } from "@/app/api/jobs/route";
import { prisma } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    jobPost: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/jobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Fetching published jobs", () => {
    const mockJobs = [
      {
        id: 1,
        jobName: "Software Engineer",
        is_Published: true,
        deadline: new Date("2025-12-31"),
        created_at: new Date("2024-01-01"),
        location: "Bangkok",
        min_salary: 50000,
        max_salary: 80000,
        aboutRole: "Develop software",
        responsibilities: "Code and test",
        requirements: ["React", "Node.js"],
        qualifications: ["Bachelor's degree"],
        company: {
          name: "Tech Corp",
          account: {
            logoUrl: "http://example.com/logo.png",
            backgroundUrl: "http://example.com/bg.png",
          },
        },
        category: { id: 1, name: "Engineering" },
        jobType: { name: "Full-time" },
        jobArrangement: { name: "Remote" },
        tags: [{ name: "JavaScript" }, { name: "TypeScript" }],
        applications: [{ id: 1 }, { id: 2 }],
        savedBy: [],
      },
    ];

    it("should return published jobs", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
    });

    it("should return job with correct structure", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const job = data[0];
      expect(job).toHaveProperty("id");
      expect(job).toHaveProperty("title");
      expect(job).toHaveProperty("companyName");
      expect(job).toHaveProperty("companyLogo");
      expect(job).toHaveProperty("category");
      expect(job).toHaveProperty("location");
      expect(job).toHaveProperty("salary");
      expect(job).toHaveProperty("type");
      expect(job).toHaveProperty("skills");
      expect(job).toHaveProperty("status");
      expect(job).toHaveProperty("isSaved");
    });

    it("should map job fields correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].title).toBe("Software Engineer");
      expect(data[0].companyName).toBe("Tech Corp");
      expect(data[0].category).toBe("Engineering");
      expect(data[0].location).toBe("Bangkok");
      expect(data[0].type).toBe("Full-time");
      expect(data[0].arrangement).toBe("Remote");
    });

    it("should map salary correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].salary.min).toBe(50000);
      expect(data[0].salary.max).toBe(80000);
    });

    it("should map skills from tags", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].skills).toEqual(["JavaScript", "TypeScript"]);
    });

    it("should map description fields correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].description.overview).toBe("Develop software");
      expect(data[0].description.responsibility).toBe("Code and test");
      expect(data[0].description.requirement).toBe("React\nNode.js");
      expect(data[0].description.qualification).toBe("Bachelor's degree");
    });

    it("should count applications correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].applied).toBe(2);
    });

    it("should set status as 'active' for published jobs before deadline", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].status).toBe("active");
    });

    it("should set status as 'draft' for unpublished jobs", async () => {
      const draftJob = {
        ...mockJobs[0],
        is_Published: false,
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([draftJob]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].status).toBe("draft");
    });

    it("should set status as 'expire' for jobs past deadline", async () => {
      const expiredJob = {
        ...mockJobs[0],
        deadline: new Date("2020-01-01"),
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([expiredJob]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].status).toBe("expire");
    });

    it("should query only published jobs with future deadlines", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const request = new Request("http://localhost:3000/api/jobs");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_Published: true,
            deadline: { gte: expect.any(Date) },
          }),
        })
      );
    });

    it("should handle jobs with null category", async () => {
      const jobWithoutCategory = {
        ...mockJobs[0],
        category: null,
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([jobWithoutCategory]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].category).toBe("");
    });

    it("should handle jobs with null aboutRole", async () => {
      const jobWithoutAboutRole = {
        ...mockJobs[0],
        aboutRole: null,
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([jobWithoutAboutRole]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].description.overview).toBe("");
    });

    it("should handle jobs with null responsibilities", async () => {
      const jobWithoutResponsibilities = {
        ...mockJobs[0],
        responsibilities: null,
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([jobWithoutResponsibilities]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].description.responsibility).toBe("-");
    });

    it("should handle jobs with null company logo", async () => {
      const jobWithoutLogo = {
        ...mockJobs[0],
        company: {
          ...mockJobs[0].company,
          account: {
            logoUrl: null,
            backgroundUrl: null,
          },
        },
      };

      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([jobWithoutLogo]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].companyLogo).toBe("");
      expect(data[0].companyBg).toBe("");
    });

    it("should return empty array when no jobs found", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe("Fetching jobs with userId", () => {
    const mockStudent = {
      id: 10,
      account_id: 1,
    };

    const mockJobSavedByUser = {
      id: 1,
      jobName: "Saved Job",
      is_Published: true,
      deadline: new Date("2025-12-31"),
      created_at: new Date("2024-01-01"),
      location: "Bangkok",
      min_salary: 50000,
      max_salary: 80000,
      aboutRole: "Test",
      responsibilities: "Test",
      requirements: ["Test"],
      qualifications: ["Test"],
      company: {
        name: "Company",
        account: { logoUrl: null, backgroundUrl: null },
      },
      category: { id: 1, name: "Engineering" },
      jobType: { name: "Full-time" },
      jobArrangement: { name: "Remote" },
      tags: [],
      applications: [],
      savedBy: [{ student_id: 10 }],
    };

    it("should fetch student when userId is provided", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs?userId=1");
      await GET(request);

      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { account_id: 1 },
      });
    });

    it("should include savedBy filter when student found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs?userId=1");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            savedBy: {
              where: {
                student_id: 10,
              },
            },
          }),
        })
      );
    });

    it("should mark job as saved when savedBy has entries", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([mockJobSavedByUser]);

      const request = new Request("http://localhost:3000/api/jobs?userId=1");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].isSaved).toBe(true);
    });

    it("should mark job as not saved when savedBy is empty", async () => {
      const jobNotSaved = {
        ...mockJobSavedByUser,
        savedBy: [],
      };

      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([jobNotSaved]);

      const request = new Request("http://localhost:3000/api/jobs?userId=1");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].isSaved).toBe(false);
    });

    it("should handle when student not found for userId", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs?userId=999");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            savedBy: false,
          }),
        })
      );
    });

    it("should set savedBy to false when no userId provided", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            savedBy: false,
          }),
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new Request("http://localhost:3000/api/jobs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch jobs");
    });

    it("should handle student lookup errors", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Student lookup failed")
      );

      const request = new Request("http://localhost:3000/api/jobs?userId=1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch jobs");
    });
  });
});
