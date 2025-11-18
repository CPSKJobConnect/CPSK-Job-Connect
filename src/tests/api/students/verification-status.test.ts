import { GET } from "@/app/api/students/verification-status/route";
import { prisma } from "@/lib/db";
import { mockStudentSession } from "@/tests/fixtures/sessions";

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
      findFirst: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");

describe("GET /api/students/verification-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      getServerSession.mockResolvedValue({
        user: {},
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Fetching verification status", () => {
    it("should return verification status for authenticated student", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockResolvedValue({
        verification_status: "PENDING",
        email_verified: true,
        student_status: "ACTIVE",
        verification_notes: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        verificationStatus: "PENDING",
        emailVerified: true,
        studentStatus: "ACTIVE",
        verificationNotes: null,
      });

      expect(prisma.student.findFirst).toHaveBeenCalledWith({
        where: { account_id: 1 },
        select: {
          verification_status: true,
          email_verified: true,
          student_status: true,
          verification_notes: true,
        },
      });
    });

    it("should return verification status with notes", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockResolvedValue({
        verification_status: "REJECTED",
        email_verified: true,
        student_status: "ACTIVE",
        verification_notes: "Please provide valid student ID",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationStatus).toBe("REJECTED");
      expect(data.verificationNotes).toBe("Please provide valid student ID");
    });

    it("should return 404 if student not found", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Different verification statuses", () => {
    it("should handle VERIFIED status", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockResolvedValue({
        verification_status: "VERIFIED",
        email_verified: true,
        student_status: "ACTIVE",
        verification_notes: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationStatus).toBe("VERIFIED");
    });

    it("should handle unverified email", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockResolvedValue({
        verification_status: "PENDING",
        email_verified: false,
        student_status: "ACTIVE",
        verification_notes: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.emailVerified).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      getServerSession.mockResolvedValue(mockStudentSession);
      (prisma.student.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle invalid user ID gracefully", async () => {
      getServerSession.mockResolvedValue({
        user: {
          id: "invalid",
        },
      });

      const response = await GET();

      // Should attempt to parse and query, then either succeed or fail gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
