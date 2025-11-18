import { GET } from "@/app/api/admin/accounts/pending/route";
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
    student: {
      findMany: jest.fn(),
    },
    company: {
      findMany: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/admin/accounts/pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user email", async () => {
      getServerSession.mockResolvedValue({
        user: {},
      });

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching pending accounts", () => {
    const mockStudentAccount = {
      id: 1,
      student_id: "S001",
      name: "Test Student",
      faculty: "Engineering",
      year: "3",
      phone: "1234567890",
      transcript: "transcript.pdf",
      verification_status: "PENDING",
      student_status: "ALUMNI",
      created_at: new Date("2024-01-01"),
      account: {
        id: 10,
        email: "student@example.com",
        documents: [
          {
            id: 1,
            documentType: { name: "Transcript" },
          },
        ],
      },
    };

    const mockCompanyAccount = {
      id: 2,
      name: "Test Company",
      address: "123 Street",
      phone: "9876543210",
      description: "A test company",
      website: "https://example.com",
      registration_status: "PENDING",
      register_day: new Date("2024-01-02"),
      account: {
        id: 20,
        email: "company@example.com",
        documents: [
          {
            id: 2,
            documentType: { name: "Company Evidence" },
          },
        ],
      },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should fetch all pending accounts by default", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([mockCompanyAccount]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);

      // Verify student account
      const studentAccount = data.find((acc: any) => acc.type === "student");
      expect(studentAccount).toBeDefined();
      expect(studentAccount.name).toBe("Test Student");
      expect(studentAccount.email).toBe("student@example.com");
      expect(studentAccount.status).toBe("PENDING");
      expect(studentAccount.details.studentId).toBe("S001");

      // Verify company account
      const companyAccount = data.find((acc: any) => acc.type === "company");
      expect(companyAccount).toBeDefined();
      expect(companyAccount.name).toBe("Test Company");
      expect(companyAccount.email).toBe("company@example.com");
      expect(companyAccount.status).toBe("PENDING");
      expect(companyAccount.details.address).toBe("123 Street");
    });

    it("should filter by account type: student only", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?type=student");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe("student");
      expect(prisma.student.findMany).toHaveBeenCalled();
      expect(prisma.company.findMany).not.toHaveBeenCalled();
    });

    it("should filter by account type: company only", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([mockCompanyAccount]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?type=company");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe("company");
      expect(prisma.student.findMany).not.toHaveBeenCalled();
      expect(prisma.company.findMany).toHaveBeenCalled();
    });

    it("should filter by status: pending", async () => {
      const pendingStudent = { ...mockStudentAccount, verification_status: "PENDING" };
      (prisma.student.findMany as jest.Mock).mockResolvedValue([pendingStudent]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?status=pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].status).toBe("PENDING");

      // Verify filter was applied in the query
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verification_status: "PENDING",
          }),
        })
      );
    });

    it("should filter by status: approved", async () => {
      const approvedStudent = { ...mockStudentAccount, verification_status: "APPROVED" };
      (prisma.student.findMany as jest.Mock).mockResolvedValue([approvedStudent]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?status=approved");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].status).toBe("APPROVED");

      // Verify filter was applied
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verification_status: "APPROVED",
          }),
        })
      );
    });

    it("should filter by status: rejected", async () => {
      const rejectedStudent = { ...mockStudentAccount, verification_status: "REJECTED" };
      (prisma.student.findMany as jest.Mock).mockResolvedValue([rejectedStudent]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?status=rejected");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].status).toBe("REJECTED");

      // Verify filter was applied
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verification_status: "REJECTED",
          }),
        })
      );
    });

    it("should fetch all statuses when status=all", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([mockCompanyAccount]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?status=all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify no status filter was applied
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            verification_status: expect.anything(),
          }),
        })
      );
    });

    it("should search by email", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?search=student@example");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify search condition was applied
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  email: { contains: "student@example", mode: "insensitive" },
                }),
              ]),
            }),
          }),
        })
      );
    });

    it("should search by student name", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?search=Test Student");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify search condition includes student name
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  student: { name: { contains: "Test Student", mode: "insensitive" } },
                }),
              ]),
            }),
          }),
        })
      );
    });

    it("should search by company name", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([mockCompanyAccount]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?search=Test Company");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify search condition includes company name
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  company: { name: { contains: "Test Company", mode: "insensitive" } },
                }),
              ]),
            }),
          }),
        })
      );
    });

    it("should detect reapplication for students with multiple transcripts", async () => {
      const reapplicationStudent = {
        ...mockStudentAccount,
        account: {
          ...mockStudentAccount.account,
          documents: [
            { id: 1, documentType: { name: "Transcript" } },
            { id: 2, documentType: { name: "Transcript" } },
          ],
        },
      };

      (prisma.student.findMany as jest.Mock).mockResolvedValue([reapplicationStudent]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].details.isReapplication).toBe(true);
      expect(data[0].details.documents).toHaveLength(2);
    });

    it("should detect reapplication for companies with multiple evidence documents", async () => {
      const reapplicationCompany = {
        ...mockCompanyAccount,
        account: {
          ...mockCompanyAccount.account,
          documents: [
            { id: 1, documentType: { name: "Company Evidence" } },
            { id: 2, documentType: { name: "Company Evidence" } },
          ],
        },
      };

      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([reapplicationCompany]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].details.isReapplication).toBe(true);
      expect(data[0].details.documents).toHaveLength(2);
    });

    it("should sort accounts by creation date (newest first)", async () => {
      const olderStudent = {
        ...mockStudentAccount,
        created_at: new Date("2024-01-01"),
      };
      const newerStudent = {
        ...mockStudentAccount,
        id: 2,
        created_at: new Date("2024-01-15"),
        account: { ...mockStudentAccount.account, id: 11 },
      };

      (prisma.student.findMany as jest.Mock).mockResolvedValue([olderStudent, newerStudent]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].id).toBe(2); // Newer student should be first
      expect(data[1].id).toBe(1); // Older student should be second
    });

    it("should return empty array when no accounts found", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should combine multiple filters correctly", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?type=student&status=pending&search=Test");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify all filters were applied
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verification_status: "PENDING",
            student_status: "ALUMNI",
            account: expect.objectContaining({
              OR: expect.any(Array),
            }),
          }),
        })
      );
      expect(prisma.company.findMany).not.toHaveBeenCalled();
    });

    it("should only fetch ALUMNI students", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([mockStudentAccount]);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending?type=student");
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify that student_status: ALUMNI is always in the query
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            student_status: "ALUMNI",
          }),
        })
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.student.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch pending accounts");
    });

    it("should handle student query errors", async () => {
      (prisma.student.findMany as jest.Mock).mockRejectedValue(new Error("Student query failed"));
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch pending accounts");
    });

    it("should handle company query errors", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.company.findMany as jest.Mock).mockRejectedValue(new Error("Company query failed"));

      const request = new Request("http://localhost:3000/api/admin/accounts/pending");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch pending accounts");
    });
  });
});
