import { GET } from "@/app/api/jobs/filter/route";
import { prisma } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    jobCategory: {
      findMany: jest.fn(),
    },
    jobType: {
      findMany: jest.fn(),
    },
    jobArrangement: {
      findMany: jest.fn(),
    },
    jobTag: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/jobs/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Fetching job filters", () => {
    const mockCategories = [
      { name: "Engineering" },
      { name: "Design" },
      { name: "Marketing" },
    ];

    const mockTypes = [
      { name: "Full-time" },
      { name: "Part-time" },
      { name: "Contract" },
    ];

    const mockArrangements = [
      { name: "On-site" },
      { name: "Remote" },
      { name: "Hybrid" },
    ];

    const mockTags = [
      { name: "JavaScript" },
      { name: "React" },
      { name: "Node.js" },
    ];

    it("should return all job filter options", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("categories");
      expect(data).toHaveProperty("types");
      expect(data).toHaveProperty("arrangements");
      expect(data).toHaveProperty("salaryRanges");
      expect(data).toHaveProperty("tags");
    });

    it("should return category names as array of strings", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(data.categories).toEqual(["Engineering", "Design", "Marketing"]);
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.every((c: any) => typeof c === "string")).toBe(true);
    });

    it("should return type names as array of strings", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(data.types).toEqual(["Full-time", "Part-time", "Contract"]);
      expect(Array.isArray(data.types)).toBe(true);
    });

    it("should return arrangement names as array of strings", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(data.arrangements).toEqual(["On-site", "Remote", "Hybrid"]);
      expect(Array.isArray(data.arrangements)).toBe(true);
    });

    it("should return tag names as array of strings", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(data.tags).toEqual(["JavaScript", "React", "Node.js"]);
      expect(Array.isArray(data.tags)).toBe(true);
    });

    it("should return predefined salary ranges", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      // Salary ranges should be 10000, 15000, 20000, ..., 50000
      expect(data.salaryRanges).toEqual([
        "10000",
        "15000",
        "20000",
        "25000",
        "30000",
        "35000",
        "40000",
        "45000",
        "50000",
      ]);
      expect(data.salaryRanges).toHaveLength(9);
    });

    it("should query all filter tables with correct select", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      await GET(request);

      expect(prisma.jobCategory.findMany).toHaveBeenCalledWith({
        select: { name: true },
      });
      expect(prisma.jobType.findMany).toHaveBeenCalledWith({
        select: { name: true },
      });
      expect(prisma.jobArrangement.findMany).toHaveBeenCalledWith({
        select: { name: true },
      });
      expect(prisma.jobTag.findMany).toHaveBeenCalledWith({
        select: { name: true },
      });
    });

    it("should handle empty categories", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual([]);
      expect(data.types).toHaveLength(3);
    });

    it("should handle empty types", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.types).toEqual([]);
      expect(data.categories).toHaveLength(3);
    });

    it("should handle empty arrangements", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.arrangements).toEqual([]);
      expect(data.tags).toHaveLength(3);
    });

    it("should handle empty tags", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toEqual([]);
      expect(data.arrangements).toHaveLength(3);
    });

    it("should handle all filter options being empty", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual([]);
      expect(data.types).toEqual([]);
      expect(data.arrangements).toEqual([]);
      expect(data.tags).toEqual([]);
      // Salary ranges should still be present
      expect(data.salaryRanges).toHaveLength(9);
    });

    it("should handle large number of filter options", async () => {
      const manyCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i + 1}`,
      }));

      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue(manyCategories);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue(mockTypes);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue(mockArrangements);
      (prisma.jobTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(50);
      expect(data.categories[0]).toBe("Category 1");
      expect(data.categories[49]).toBe("Category 50");
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should handle jobCategory query error", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockRejectedValue(
        new Error("Category query failed")
      );

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should handle jobType query error", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockRejectedValue(
        new Error("Type query failed")
      );

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should handle jobArrangement query error", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobArrangement.findMany as jest.Mock).mockRejectedValue(
        new Error("Arrangement query failed")
      );

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("should handle jobTag query error", async () => {
      (prisma.jobCategory.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobArrangement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobTag.findMany as jest.Mock).mockRejectedValue(
        new Error("Tag query failed")
      );

      const request = new Request("http://localhost:3000/api/jobs/filter");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
