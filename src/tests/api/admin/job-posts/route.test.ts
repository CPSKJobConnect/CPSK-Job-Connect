import { GET } from "@/app/api/admin/job-posts/route";
import { prisma } from "@/lib/db";
import { mockAdminSession, mockStudentSession } from "@/tests/fixtures/sessions";

// Mock dependencies
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    jobPost: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    report: {
      findMany: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/admin/job-posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if not admin", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching job posts", () => {
    const mockJobPosts = [
      {
        id: 1,
        jobName: "Software Engineer",
        location: "Bangkok",
        min_salary: 50000,
        max_salary: 80000,
        deadline: new Date("2025-12-31"),
        is_Published: true,
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
        company: {
          id: 10,
          name: "Tech Corp",
          account: { email: "tech@example.com" },
        },
        jobType: { name: "Full-time" },
        jobArrangement: { name: "Remote" },
        category: { name: "Engineering" },
        tags: [{ name: "JavaScript" }, { name: "React" }],
        applications: [{ id: 1, status: 1 }, { id: 2, status: 3 }],
      },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should fetch job posts with pagination", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobPosts).toHaveLength(1);
      expect(data.pagination.totalCount).toBe(1);
    });

    it("should use default pagination values", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it("should handle custom page and limit", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(100);

      const request = new Request("http://localhost:3000/api/admin/job-posts?page=3&limit=20");
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(3);
      expect(data.pagination.limit).toBe(20);
      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        })
      );
    });

    it("should filter by search term", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/admin/job-posts?search=engineer");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ jobName: { contains: "engineer", mode: "insensitive" } }),
            ]),
          }),
        })
      );
    });

    it("should filter by published status", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/admin/job-posts?status=published");
      await GET(request);

      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_Published: true,
          }),
        })
      );
    });

    it("should filter by reported jobs", async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue([
        { target_id: 1 },
        { target_id: 2 },
      ]);
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(2);

      const request = new Request("http://localhost:3000/api/admin/job-posts?reported=true");
      await GET(request);

      expect(prisma.report.findMany).toHaveBeenCalled();
      expect(prisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: [1, 2] },
          }),
        })
      );
    });

    it("should format job posts correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      const response = await GET(request);
      const data = await response.json();

      const job = data.jobPosts[0];
      expect(job.jobName).toBe("Software Engineer");
      expect(job.minSalary).toBe(50000);
      expect(job.maxSalary).toBe(80000);
      expect(job.jobType).toBe("Full-time");
      expect(job.applicationsCount).toBe(2);
      expect(job.acceptedApplications).toBe(1);
    });

    it("should calculate pagination correctly", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockResolvedValue(mockJobPosts);
      (prisma.jobPost.count as jest.Mock).mockResolvedValue(45);

      const request = new Request("http://localhost:3000/api/admin/job-posts?page=2&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.totalPages).toBe(5);
      expect(data.pagination.page).toBe(2);
    });

    it("should handle database errors", async () => {
      (prisma.jobPost.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost:3000/api/admin/job-posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch job posts");
    });
  });
});
