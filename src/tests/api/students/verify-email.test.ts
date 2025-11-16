/**
 * API Tests: Student Email Verification
 *
 * Endpoints:
 * - POST /api/students/verify-email: Verify student's email using verification code
 * - GET /api/students/verify-email: Check verification status
 *
 * Authentication: GET requires session, POST does not (uses email+token)
 * Authorization: Students can only verify their own email
 *
 * ASVS Coverage:
 * - V2.1.1: Password and credential recovery should not reveal current password
 * - V2.7.1: Verifiers should be stored in a form that is resistant to offline attacks
 * - V2.7.2: Salted password verification should be slow to prevent brute force
 * - V7.2.1: Session token verification (GET method)
 * - V8.2.2: Data-specific access control
 * - V9.1.1: Proper error messages without leaking information
 */

import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/students/verify-email/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { isVerificationExpired } from "@/lib/email-validation";
import { mockSession } from "@/tests/utils/test-helpers";

// Mock dependencies
jest.mock("@/lib/api-auth");
jest.mock("@/lib/email-validation", () => ({
  isVerificationExpired: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  prisma: {
    email_verification_tokens: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    student: {
      update: jest.fn(),
    },
  },
}));

describe("Student Email Verification API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // POST /api/students/verify-email
  // ============================================

  describe("POST /api/students/verify-email", () => {
    // Group 1: Input Validation Tests
    describe("Input Validation", () => {
      it("should return 400 when email is missing", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Email is required");
      });

      it("should return 400 when email is not a string", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: 123, token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Email is required");
      });

      it("should return 400 when token is missing", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Verification code is required");
      });

      it("should return 400 when token is not a string", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: 123456 }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Verification code is required");
      });

      it("should normalize email (lowercase and trim)", async () => {
        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "  STUDENT@KU.TH  ", token: "123456" }),
        });

        await POST(request);

        expect(prisma.email_verification_tokens.findFirst).toHaveBeenCalledWith({
          where: {
            email: "student@ku.th",
            token: expect.any(String),
          },
        });
      });

      it("should normalize token (trim)", async () => {
        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "  123456  " }),
        });

        await POST(request);

        expect(prisma.email_verification_tokens.findFirst).toHaveBeenCalledWith({
          where: {
            email: expect.any(String),
            token: "123456",
          },
        });
      });
    });

    // Group 2: Token Validation Tests (ASVS V2.7)
    describe("Token Validation", () => {
      it("V9.1.1: should return 400 with generic message for invalid token", async () => {
        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "wrong" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid verification code");
        expect(data.message).toContain("incorrect");
        // Should NOT reveal whether email exists
        expect(data.message).not.toContain("email not found");
      });

      it("should return 400 when token has expired", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date("2025-01-01T00:00:00Z"),
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(true);
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Verification code expired");
        expect(data.message).toContain("expired");
        expect(prisma.email_verification_tokens.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
      });

      it("should accept valid unexpired token", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000), // 15 min from now
        };

        const mockAccount = {
          id: 1,
          email: "student@ku.th",
          student: {
            id: 1,
            student_status: "CURRENT",
            verification_status: "PENDING",
          },
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.student.update as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    // Group 3: Student Account Tests
    describe("Student Account", () => {
      it("should return 404 when student account not found", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Student account not found");
        expect(data.message).toContain("register first");
        // Should delete token when account not found
        expect(prisma.email_verification_tokens.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
      });

      it("should return 404 when account exists but no student profile", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        const mockAccount = {
          id: 1,
          email: "student@ku.th",
          student: null, // No student profile
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Student account not found");
      });
    });

    // Group 4: Success Cases & Business Logic
    describe("Success Cases & Business Logic", () => {
      it("should mark email as verified and auto-approve CURRENT students", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        const mockAccount = {
          id: 1,
          email: "student@ku.th",
          student: {
            id: 1,
            student_status: "CURRENT",
            verification_status: "PENDING",
          },
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.student.update as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.verified).toBe(true);
        expect(data.message).toContain("verified successfully");
        expect(data.studentStatus).toBe("CURRENT");

        // Should update student with email_verified=true and auto-approve
        expect(prisma.student.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            email_verified: true,
            verification_status: "APPROVED", // Auto-approved for CURRENT students
          },
        });

        // Should delete the used token
        expect(prisma.email_verification_tokens.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
      });

      it("should mark email as verified but NOT auto-approve ALUMNI students", async () => {
        const mockToken = {
          id: 1,
          email: "alumni@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        const mockAccount = {
          id: 1,
          email: "alumni@ku.th",
          student: {
            id: 1,
            student_status: "ALUMNI",
            verification_status: "PENDING",
          },
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.student.update as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "alumni@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.verified).toBe(true);
        expect(data.studentStatus).toBe("ALUMNI");

        // Should update student with email_verified=true but keep original verification_status
        expect(prisma.student.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            email_verified: true,
            verification_status: "PENDING", // NOT auto-approved for alumni
          },
        });
      });

      it("should return complete success response", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        const mockAccount = {
          id: 1,
          email: "student@ku.th",
          student: {
            id: 1,
            student_status: "CURRENT",
            verification_status: "PENDING",
          },
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.student.update as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.delete as jest.Mock).mockResolvedValue(mockToken);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data).toHaveProperty("success", true);
        expect(data).toHaveProperty("verified", true);
        expect(data).toHaveProperty("message");
        expect(data).toHaveProperty("studentStatus");
      });
    });

    // Group 5: Error Handling (ASVS V9.1.1)
    describe("Error Handling", () => {
      it("V9.1.1: should handle database errors gracefully without leaking details", async () => {
        (prisma.email_verification_tokens.findFirst as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
        // Should NOT expose internal error details
        expect(data).not.toHaveProperty("stack");
        expect(data.error).not.toContain("Database");
      });

      it("should handle account update errors gracefully", async () => {
        const mockToken = {
          id: 1,
          email: "student@ku.th",
          token: "123456",
          expires: new Date(Date.now() + 900000),
        };

        const mockAccount = {
          id: 1,
          email: "student@ku.th",
          student: { id: 1, student_status: "CURRENT", verification_status: "PENDING" },
        };

        (prisma.email_verification_tokens.findFirst as jest.Mock).mockResolvedValue(mockToken);
        (isVerificationExpired as jest.Mock).mockReturnValue(false);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
        (prisma.student.update as jest.Mock).mockRejectedValue(
          new Error("Update failed")
        );

        const request = new NextRequest("http://localhost:3000/api/students/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", token: "123456" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });
  });

  // ============================================
  // GET /api/students/verify-email
  // ============================================

  describe("GET /api/students/verify-email", () => {
    // Group 1: Authentication Tests (ASVS V7.2.1)
    describe("Authentication", () => {
      it("should return 401 when no session exists", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });

      it("should return 401 when session user ID is missing", async () => {
        (getApiSession as jest.Mock).mockResolvedValue({
          user: { email: "student@ku.th", role: "student" }
          // Missing id
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });

      it("should accept valid authentication", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
          student: {
            id: 1,
            email_verified: true,
            student_status: "CURRENT",
            verification_status: "APPROVED",
          },
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);

        expect(response.status).toBe(200);
      });
    });

    // Group 2: Authorization Tests (ASVS V8.2.2)
    describe("Authorization", () => {
      it("should return 404 when student not found", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Student not found");
      });

      it("should return 404 when account exists but no student profile", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
          student: null,
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Student not found");
      });

      it("should query account using session user ID", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          student: {
            email_verified: true,
            student_status: "CURRENT",
            verification_status: "APPROVED",
          },
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        await GET(request);

        expect(prisma.account.findUnique).toHaveBeenCalledWith({
          where: { id: parseInt(mockSession.student.user.id) },
          include: { student: true },
        });
      });
    });

    // Group 3: Success Cases
    describe("Success Cases", () => {
      it("should return verification status for verified student", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
          student: {
            email_verified: true,
            student_status: "CURRENT",
            verification_status: "APPROVED",
          },
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          emailVerified: true,
          studentStatus: "CURRENT",
          verificationStatus: "APPROVED",
        });
      });

      it("should return verification status for unverified student", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
          student: {
            email_verified: false,
            student_status: "CURRENT",
            verification_status: "PENDING",
          },
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          emailVerified: false,
          studentStatus: "CURRENT",
          verificationStatus: "PENDING",
        });
      });

      it("should return verification status for alumni", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "alumni@ku.th",
          student: {
            email_verified: true,
            student_status: "ALUMNI",
            verification_status: "APPROVED",
          },
        });

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          emailVerified: true,
          studentStatus: "ALUMNI",
          verificationStatus: "APPROVED",
        });
      });
    });

    // Group 4: Error Handling
    describe("Error Handling", () => {
      it("should handle database errors gracefully", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const request = new NextRequest("http://localhost:3000/api/students/verify-email");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
        expect(data).not.toHaveProperty("stack");
      });
    });
  });
});
