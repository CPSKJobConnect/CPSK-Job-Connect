import { GET } from "@/app/api/auth/check-status/route";
import { prisma } from "@/lib/db";
import { mockStudentSession, mockCompanySession } from "@/tests/fixtures/sessions";

// Mock dependencies
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/auth/check-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        active: false,
        error: "No session",
      });
    });

    it("should return 401 if session has no user ID", async () => {
      getServerSession.mockResolvedValue({
        user: {},
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        active: false,
        error: "No session",
      });
    });
  });

  describe("Checking account status", () => {
    it("should return active=true for active account", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        is_active: true,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ active: true });

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { is_active: true },
      });
    });

    it("should return active=false for disabled account", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 113,
        is_active: false,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ active: false });
    });

    it("should work for company accounts", async () => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        is_active: true,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ active: true });

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        select: { is_active: true },
      });
    });

    it("should return 404 if account not found", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        active: false,
        error: "Account not found",
      });
    });

    it("should return 400 for invalid user ID", async () => {
      getServerSession.mockResolvedValue({
        user: {
          id: "invalid",
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        active: false,
        error: "Invalid user ID",
      });
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        active: false,
        error: "Server error",
      });
    });
  });

  describe("Real-time status updates", () => {
    it("should always query database for current status", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 113,
        is_active: false,
      });

      // Call twice to ensure it queries DB each time
      await GET();
      await GET();

      expect(prisma.account.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should reflect immediate status changes", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);

      // First call - active
      (prisma.account.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 113,
        is_active: true,
      });

      const response1 = await GET();
      const data1 = await response1.json();
      expect(data1.active).toBe(true);

      // Second call - disabled (simulating admin disabled the account)
      (prisma.account.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 113,
        is_active: false,
      });

      const response2 = await GET();
      const data2 = await response2.json();
      expect(data2.active).toBe(false);
    });
  });
});
