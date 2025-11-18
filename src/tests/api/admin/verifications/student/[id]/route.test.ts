import { PATCH, GET } from "@/app/api/admin/verifications/student/[id]/route";
import { prisma } from "@/lib/db";
import { mockAdminSession, mockStudentSession } from "@/tests/fixtures/sessions";
import { sendAlumniStatusEmail, sendVerificationEmail } from "@/lib/email";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/email-validation";

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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    email_verification_tokens: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendAlumniStatusEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

jest.mock("@/lib/email-validation", () => ({
  generateVerificationCode: jest.fn(() => "TEST123"),
  getVerificationExpiry: jest.fn(() => new Date("2025-12-31")),
}));

const { getApiSession } = require("@/lib/api-auth");

describe("PATCH /api/admin/verifications/student/[id]", () => {
  const mockAdminAccount = {
    id: 1,
    accountRole: { name: "admin" },
  };

  const mockAlumniStudent = {
    id: 10,
    account_id: 5,
    name: "John Doe",
    student_status: "ALUMNI",
    account: {
      email: "john@example.com",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("should return 401 if not authenticated", async () => {
      getApiSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if not admin", async () => {
      getApiSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        accountRole: { name: "student" },
      });

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockAdminSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("should return 400 for invalid student ID", async () => {
      const request = new Request("http://localhost/api/admin/verifications/student/abc", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "abc" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid student ID");
    });

    it("should return 400 if status is missing", async () => {
      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid status. Must be APPROVED or REJECTED");
    });

    it("should return 400 for invalid status value", async () => {
      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "PENDING" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid status. Must be APPROVED or REJECTED");
    });

    it("should return 404 if student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/verifications/student/999", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });

    it("should return 400 if student is not alumni", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        ...mockAlumniStudent,
        student_status: "ACTIVE",
      });

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid operation");
      expect(data.message).toBe("Only alumni accounts require manual verification");
    });
  });

  describe("Approval Process", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockAdminSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockAlumniStudent);
    });

    it("should approve alumni and send emails", async () => {
      const updatedStudent = {
        ...mockAlumniStudent,
        verification_status: "APPROVED",
        verified_by: 1,
        verified_at: new Date(),
        verifiedByAdmin: { username: "Admin" },
      };
      (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);
      (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED", notes: "All good" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Student approved successfully");
      expect(data.student.verification_status).toBe("APPROVED");

      expect(sendAlumniStatusEmail).toHaveBeenCalledWith(
        "john@example.com",
        "John Doe",
        true,
        "All good"
      );
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "john@example.com",
        "TEST123",
        "John Doe"
      );
      expect(prisma.email_verification_tokens.create).toHaveBeenCalledWith({
        data: {
          email: "john@example.com",
          token: "TEST123",
          expires: expect.any(Date),
        },
      });
    });

    it("should reject alumni without sending verification email", async () => {
      const updatedStudent = {
        ...mockAlumniStudent,
        verification_status: "REJECTED",
        verified_by: 1,
        verified_at: new Date(),
        verifiedByAdmin: { username: "Admin" },
      };
      (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED", notes: "Invalid documents" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Student rejected successfully");

      expect(sendAlumniStatusEmail).toHaveBeenCalledWith(
        "john@example.com",
        "John Doe",
        false,
        "Invalid documents"
      );
      expect(sendVerificationEmail).not.toHaveBeenCalled();
      expect(prisma.email_verification_tokens.create).not.toHaveBeenCalled();
    });

    it("should create notification on approval", async () => {
      const updatedStudent = {
        ...mockAlumniStudent,
        verification_status: "APPROVED",
        verified_by: 1,
        verified_at: new Date(),
        verifiedByAdmin: { username: "Admin" },
      };
      (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      await PATCH(request, { params: Promise.resolve({ id: "10" }) });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          account_id: 5,
          sender_id: 1,
          message: "Your alumni verification has been approved! You can now apply for jobs.",
        },
      });
    });

    it("should create notification on rejection", async () => {
      const updatedStudent = {
        ...mockAlumniStudent,
        verification_status: "REJECTED",
        verified_by: 1,
        verified_at: new Date(),
        verifiedByAdmin: { username: "Admin" },
      };
      (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED" }),
      });
      await PATCH(request, { params: Promise.resolve({ id: "10" }) });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          account_id: 5,
          sender_id: 1,
          message: "Your alumni verification has been rejected. Please contact support for more information.",
        },
      });
    });

    it("should handle email errors gracefully", async () => {
      const updatedStudent = {
        ...mockAlumniStudent,
        verification_status: "APPROVED",
        verified_by: 1,
        verified_at: new Date(),
        verifiedByAdmin: { username: "Admin" },
      };
      (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);
      (sendAlumniStatusEmail as jest.Mock).mockRejectedValue(new Error("Email failed"));
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });

      expect(response.status).toBe(200);
    });

    it("should handle database errors", async () => {
      (prisma.student.update as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/admin/verifications/student/10", {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});

describe("GET /api/admin/verifications/student/[id]", () => {
  const mockAdminAccount = {
    id: 1,
    accountRole: { name: "admin" },
  };

  const mockStudentDetails = {
    id: 10,
    student_id: "S001",
    name: "John Doe",
    faculty: "Engineering",
    year: "4",
    phone: "1234567890",
    student_status: "ALUMNI",
    verification_status: "PENDING",
    email_verified: false,
    transcript: "transcript.pdf",
    verified_by: 1,
    verified_at: new Date("2024-01-01"),
    verification_notes: "Test notes",
    created_at: new Date("2023-01-01"),
    account: {
      email: "john@example.com",
      created_at: new Date("2023-01-01"),
    },
    verifiedByAdmin: {
      username: "Admin",
      email: "admin@example.com",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("should return 401 if not authenticated", async () => {
      getApiSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/verifications/student/10");
      const response = await GET(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if not admin", async () => {
      getApiSession.mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        accountRole: { name: "student" },
      });

      const request = new Request("http://localhost/api/admin/verifications/student/10");
      const response = await GET(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden - Admin access required");
    });
  });

  describe("Fetching Student Details", () => {
    beforeEach(() => {
      getApiSession.mockResolvedValue(mockAdminSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("should return 400 for invalid student ID", async () => {
      const request = new Request("http://localhost/api/admin/verifications/student/abc");
      const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid student ID");
    });

    it("should return 404 if student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/admin/verifications/student/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });

    it("should return student details successfully", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudentDetails);

      const request = new Request("http://localhost/api/admin/verifications/student/10");
      const response = await GET(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(10);
      expect(data.student_id).toBe("S001");
      expect(data.name).toBe("John Doe");
      expect(data.email).toBe("john@example.com");
      expect(data.faculty).toBe("Engineering");
      expect(data.year).toBe("4");
      expect(data.phone).toBe("1234567890");
      expect(data.student_status).toBe("ALUMNI");
      expect(data.verification_status).toBe("PENDING");
      expect(data.verified_by).toBe("Admin");
      expect(data.verification_notes).toBe("Test notes");
    });

    it("should include all required fields", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudentDetails);

      const request = new Request("http://localhost/api/admin/verifications/student/10");
      const response = await GET(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("student_id");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("faculty");
      expect(data).toHaveProperty("year");
      expect(data).toHaveProperty("phone");
      expect(data).toHaveProperty("student_status");
      expect(data).toHaveProperty("verification_status");
      expect(data).toHaveProperty("email_verified");
      expect(data).toHaveProperty("transcript");
      expect(data).toHaveProperty("verified_by");
      expect(data).toHaveProperty("verified_at");
      expect(data).toHaveProperty("verification_notes");
      expect(data).toHaveProperty("created_at");
      expect(data).toHaveProperty("account_created_at");
    });

    it("should handle database errors", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/admin/verifications/student/10");
      const response = await GET(request, { params: Promise.resolve({ id: "10" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
