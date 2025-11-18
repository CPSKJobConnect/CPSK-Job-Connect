import { GET } from "@/app/api/application-status/route";
import { prisma } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    applicationStatus: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/application-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Fetching application statuses", () => {
    const mockStatuses = [
      { id: 1, name: "Pending" },
      { id: 2, name: "Reviewing" },
      { id: 3, name: "Accepted" },
      { id: 4, name: "Rejected" },
    ];

    it("should return all application statuses", async () => {
      (prisma.applicationStatus.findMany as jest.Mock).mockResolvedValue(mockStatuses);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.statuses).toEqual(mockStatuses);
      expect(data.statuses).toHaveLength(4);
    });

    it("should call prisma.applicationStatus.findMany", async () => {
      (prisma.applicationStatus.findMany as jest.Mock).mockResolvedValue(mockStatuses);

      await GET();

      expect(prisma.applicationStatus.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.applicationStatus.findMany).toHaveBeenCalledWith();
    });

    it("should return empty array when no statuses exist", async () => {
      (prisma.applicationStatus.findMany as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.statuses).toEqual([]);
    });

    it("should return statuses with all fields", async () => {
      const detailedStatuses = [
        { id: 1, name: "Pending", description: "Application is pending review" },
        { id: 2, name: "Accepted", description: "Application has been accepted" },
      ];

      (prisma.applicationStatus.findMany as jest.Mock).mockResolvedValue(detailedStatuses);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.statuses[0]).toHaveProperty("id");
      expect(data.statuses[0]).toHaveProperty("name");
      expect(data.statuses[0].description).toBe("Application is pending review");
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      (prisma.applicationStatus.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch statuses");
    });

    it("should handle query failures", async () => {
      (prisma.applicationStatus.findMany as jest.Mock).mockRejectedValue(
        new Error("Query failed")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch statuses");
    });
  });
});
