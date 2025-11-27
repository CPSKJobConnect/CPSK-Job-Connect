import { GET } from "@/app/api/admin/reference-data/route";
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
    company: {
      findMany: jest.fn(),
    },
    jobType: {
      findMany: jest.fn(),
    },
    jobArrangement: {
      findMany: jest.fn(),
    },
    jobCategory: {
      findMany: jest.fn(),
    },
    jobTag: {
      findMany: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/admin/reference-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user email", async () => {
      getServerSession.mockResolvedValue({
        user: {},
      });

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching reference data", () => {
    const mockCompanies = [
      {
        id: 1,
        name: "Company A",
        account: { email: "companyA@example.com" },
      },
      {
        id: 2,
        name: "Company B",
        account: { email: "companyB@example.com" },
      },
    ];

    const mockJobTypes = [
      { id: 1, name: "Full-time" },
      { id: 2, name: "Part-time" },
    ];

    const mockJobArrangements = [
      { id: 1, name: "Remote" },
      { id: 2, name: "On-site" },
    ];

    const mockCategories = [
      { id: 1, name: "Engineering" },
      { id: 2, name: "Design" },
    ];

    const mockTags = [
      { id: 1, name: "JavaScript" },
      { id: 2, name: "React" },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should return all reference data for admin", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("companies");
      expect(data).toHaveProperty("jobTypes");
      expect(data).toHaveProperty("jobArrangements");
      expect(data).toHaveProperty("categories");
      expect(data).toHaveProperty("tags");
    });

    it("should return approved companies only", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.companies).toEqual(mockCompanies);

      // Verify that companies query filters by approved status
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: { registration_status: "approved" },
        select: {
          id: true,
          name: true,
          account: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should return job types sorted by name", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobTypes).toEqual(mockJobTypes);

      expect(prisma.jobType.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should return job arrangements sorted by name", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobArrangements).toEqual(mockJobArrangements);

      expect(prisma.jobArrangement.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should return categories sorted by name", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual(mockCategories);

      expect(prisma.jobCategory.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should return tags sorted by name", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toEqual(mockTags);

      expect(prisma.jobTag.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should fetch all data in parallel using Promise.all", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockJobTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockJobArrangements);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      await GET(request);

      // All queries should be called
      expect(prisma.company.findMany).toHaveBeenCalled();
      expect(prisma.jobType.findMany).toHaveBeenCalled();
      expect(prisma.jobArrangement.findMany).toHaveBeenCalled();
      expect(prisma.jobCategory.findMany).toHaveBeenCalled();
      expect(prisma.jobTag.findMany).toHaveBeenCalled();
    });

    it("should handle empty reference data", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.companies).toEqual([]);
      expect(data.jobTypes).toEqual([]);
      expect(data.jobArrangements).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.tags).toEqual([]);
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.company.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch reference data");
    });

    it("should handle company query errors", async () => {
      (prisma.company.findMany as jest.Mock).mockRejectedValue(
        new Error("Company query failed")
      );

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch reference data");
    });

    it("should handle jobType query errors", async () => {
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockRejectedValue(
        new Error("JobType query failed")
      );

      const request = new Request("http://localhost:3000/api/admin/reference-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch reference data");
    });
  });
});
