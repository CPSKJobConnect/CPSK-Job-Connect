import { GET } from "@/app/api/admin/users/route";
import { prisma } from "@/lib/db";
import { mockAdminSession, mockStudentSession, mockCompanySession } from "@/tests/fixtures/sessions";

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
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/admin/users", () => {
  const mockUrl = "http://localhost:3000/api/admin/users";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request(mockUrl);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if not admin", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);

      const request = new Request(mockUrl);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching users", () => {
    const mockAccounts = [
      {
        id: 1,
        email: "student1@example.com",
        username: "student1",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
        is_active: true,
        accountRole: { id: 1, name: "Student" },
        student: {
          id: 1,
          student_id: "S001",
          name: "Student One",
          faculty: "Engineering",
          year: "3",
          phone: "1234567890",
        },
        company: null,
      },
      {
        id: 2,
        email: "company1@example.com",
        username: "company1",
        created_at: new Date("2024-01-03"),
        updated_at: new Date("2024-01-04"),
        is_active: false,
        accountRole: { id: 2, name: "Company" },
        student: null,
        company: {
          id: 1,
          name: "Tech Corp",
          address: "123 Tech St",
          phone: "0987654321",
          description: "A tech company",
          website: "https://techcorp.com",
          registration_status: "approved",
        },
      },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
      (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);
      (prisma.account.count as jest.Mock).mockResolvedValue(2);
    });

    it("should return users list with pagination", async () => {
      const request = new Request(`${mockUrl}?page=1&limit=10`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1,
      });
    });

    it("should include user profile data", async () => {
      const request = new Request(mockUrl);
      const response = await GET(request);
      const data = await response.json();

      const studentUser = data.users[0];
      expect(studentUser).toEqual({
        id: 1,
        name: "student1",
        email: "student1@example.com",
        role: "student",
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        profile: {
          phone: "1234567890",
          department: "Engineering",
          studentId: "S001",
        },
      });

      const companyUser = data.users[1];
      expect(companyUser).toEqual({
        id: 2,
        name: "company1",
        email: "company1@example.com",
        role: "company",
        isActive: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        profile: {
          phone: "0987654321",
          location: "123 Tech St",
          companyName: "Tech Corp",
          companySize: "A tech company",
        },
      });
    });

    it("should filter by role", async () => {
      const request = new Request(`${mockUrl}?role=student`);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accountRole: {
              name: { equals: "student", mode: "insensitive" },
            },
          }),
        })
      );
    });

    it("should filter by status", async () => {
      const request = new Request(`${mockUrl}?status=active`);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
          }),
        })
      );
    });

    it("should search by email or username", async () => {
      const request = new Request(`${mockUrl}?search=student`);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: "student", mode: "insensitive" } },
              { username: { contains: "student", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });

    it("should handle pagination correctly", async () => {
      const request = new Request(`${mockUrl}?page=2&limit=5`);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      );
    });

    it("should exclude pending companies", async () => {
      const request = new Request(mockUrl);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: {
              company: {
                registration_status: "pending",
              },
            },
          }),
        })
      );
    });

    it("should use default pagination if not provided", async () => {
      const request = new Request(mockUrl);
      await GET(request);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (page 1 - 1) * 10
          take: 10,
        })
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.account.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = new Request(mockUrl);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch users");
    });
  });
});
