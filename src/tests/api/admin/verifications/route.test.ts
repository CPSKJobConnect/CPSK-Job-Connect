import { GET } from "@/app/api/admin/verifications/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/admin/verifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: {} });

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "user@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        accountRole: { name: "student" },
      });

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching verification requests", () => {
    const mockAdminSession = {
      user: { id: "1", email: "admin@example.com" },
    };

    const mockAdminAccount = {
      id: 1,
      accountRole: { name: "admin" },
    };

    const mockStudents = [
      {
        id: 10,
        student_id: "S001",
        name: "John Doe",
        faculty: "Engineering",
        year: "Alumni",
        verification_status: "PENDING",
        email_verified: true,
        transcript: "transcript.pdf",
        verified_at: null,
        created_at: new Date("2024-01-01"),
        account: {
          email: "john@example.com",
          created_at: new Date("2023-12-01"),
        },
        verifiedByAdmin: null,
      },
      {
        id: 11,
        student_id: "S002",
        name: "Jane Smith",
        faculty: "Science",
        year: "Alumni",
        verification_status: "PENDING",
        email_verified: true,
        transcript: "transcript2.pdf",
        verified_at: null,
        created_at: new Date("2024-01-02"),
        account: {
          email: "jane@example.com",
          created_at: new Date("2023-12-02"),
        },
        verifiedByAdmin: null,
      },
    ];

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("should return pending verifications by default", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.students).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it("should filter by PENDING status", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications?status=PENDING");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            student_status: "ALUMNI",
            verification_status: "PENDING",
          },
        })
      );
    });

    it("should filter by APPROVED status", async () => {
      const approvedStudents = mockStudents.map(s => ({
        ...s,
        verification_status: "APPROVED",
        verified_at: new Date("2024-01-15"),
        verifiedByAdmin: { username: "admin1" },
      }));
      (prisma.student.findMany as jest.Mock).mockResolvedValue(approvedStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications?status=APPROVED");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            student_status: "ALUMNI",
            verification_status: "APPROVED",
          },
        })
      );
    });

    it("should filter by REJECTED status", async () => {
      const rejectedStudents = mockStudents.map(s => ({
        ...s,
        verification_status: "REJECTED",
      }));
      (prisma.student.findMany as jest.Mock).mockResolvedValue(rejectedStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications?status=REJECTED");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            student_status: "ALUMNI",
            verification_status: "REJECTED",
          },
        })
      );
    });

    it("should only fetch ALUMNI students", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      await GET(request);

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            student_status: "ALUMNI",
          }),
        })
      );
    });

    it("should format student data correctly", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudents[0]]);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(data.students[0]).toEqual({
        id: 10,
        student_id: "S001",
        name: "John Doe",
        email: "john@example.com",
        faculty: "Engineering",
        year: "Alumni",
        verification_status: "PENDING",
        email_verified: true,
        transcript: "transcript.pdf",
        verified_by: undefined,
        verified_at: null,
        created_at: expect.any(String),
        account_created_at: expect.any(String),
      });
    });

    it("should include verified_by for approved students", async () => {
      const approvedStudent = {
        ...mockStudents[0],
        verification_status: "APPROVED",
        verified_at: new Date("2024-01-15"),
        verifiedByAdmin: { username: "admin1" },
      };
      (prisma.student.findMany as jest.Mock).mockResolvedValue([approvedStudent]);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications?status=APPROVED");
      const response = await GET(request);
      const data = await response.json();

      expect(data.students[0].verified_by).toBe("admin1");
      expect(data.students[0].verified_at).toBeDefined();
    });

    it("should order by created_at descending", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      await GET(request);

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            created_at: "desc",
          },
        })
      );
    });

    it("should return empty array when no students found", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.students).toEqual([]);
      expect(data.total).toBe(0);
    });

    it("should handle students with missing account data", async () => {
      const studentWithoutAccount = {
        ...mockStudents[0],
        account: null,
      };
      (prisma.student.findMany as jest.Mock).mockResolvedValue([studentWithoutAccount]);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.students[0].email).toBe("");
    });

    it("should ignore invalid status values", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const request = new NextRequest("http://localhost:3000/api/admin/verifications?status=INVALID");
      await GET(request);

      // Should default to PENDING when status is invalid
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            student_status: "ALUMNI",
          },
        })
      );
    });

    it("should handle database errors", async () => {
      (prisma.student.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/admin/verifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
