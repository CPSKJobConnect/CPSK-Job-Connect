/**
 * API Tests: Send Email Verification
 *
 * Endpoint: POST /api/students/send-verification
 * Purpose: Send a verification code to student's email
 * Authentication: Not required (uses email from request body)
 * Rate Limiting: 1 request per minute per email
 *
 * ASVS Coverage:
 * - V2.1.7: Verification codes should be time-limited
 * - V2.7.1: Verification codes should be generated securely
 * - V2.8.1: Rate limiting to prevent abuse
 * - V9.1.1: Proper error messages without leaking information
 * - V9.2.1: Log security events (email sending attempts)
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/students/send-verification/route";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import {
  isValidKUEmail,
  generateVerificationCode,
  getVerificationExpiry,
} from "@/lib/email-validation";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/email");
jest.mock("@/lib/email-validation", () => ({
  isValidKUEmail: jest.fn(),
  generateVerificationCode: jest.fn(),
  getVerificationExpiry: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findFirst: jest.fn(),
    },
    email_verification_tokens: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Silence console logs
silenceConsole();

// ============================================================================
// POST /api/students/send-verification
// ============================================================================

describe("Send Email Verification API", () => {
  // Use unique emails per test to avoid rate limiting conflicts
  let emailCounter = 0;

  beforeEach(() => {
    resetAllMocks();
    emailCounter++;
  });


  // Helper to generate unique email for each test to avoid rate limiting
  const getUniqueEmail = () => `test${emailCounter}@ku.th`;

  // ============================================
  // POST /api/students/send-verification
  // ============================================

  describe("POST /api/students/send-verification", () => {
    // Group 1: Input Validation Tests
    describe("Input Validation", () => {
      it("should return 400 when email is missing", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ studentName: "John Doe" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Email is required");
      });

      it("should return 400 when email is not a string", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: 123, studentName: "John Doe" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Email is required");
      });

      it("should return 400 when CURRENT student uses non-KU email", async () => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue({
          student_status: "CURRENT",
        });
        (isValidKUEmail as jest.Mock).mockReturnValue(false);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: "student@gmail.com", studentName: "John Doe" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Current students must use a valid KU email");
      });

      it("should accept non-KU email for ALUMNI students", async () => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue({
          student_status: "ALUMNI",
        });
        (isValidKUEmail as jest.Mock).mockReturnValue(false);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: "alumni@gmail.com", studentName: "Alumni User" }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });

      it("should accept KU email for CURRENT students", async () => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue({
          student_status: "CURRENT",
        });
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: "student@ku.th", studentName: "John Doe" }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });

      it("should normalize email (lowercase and trim)", async () => {
        const email = getUniqueEmail();
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        const upperEmail = email.toUpperCase();
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: `  ${upperEmail}  `, studentName: "John Doe" }),
        });

        await POST(request);

        expect(prisma.email_verification_tokens.create).toHaveBeenCalledWith({
          data: {
            email: email.toLowerCase(),
            token: expect.any(String),
            expires: expect.any(Date),
          },
        });
      });
    });

    // Group 2: Rate Limiting Tests (ASVS V2.8.1)
    describe("Rate Limiting (ASVS V2.8.1)", () => {
      it("V2.8.1: should allow first request for an email", async () => {
        const email = getUniqueEmail();
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test User" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain("Verification code sent");
      });

      it("V2.8.1: should reject second request within rate limit window", async () => {
        const email = getUniqueEmail();
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        // First request
        const request1 = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Rate Test" }),
        });
        const response1 = await POST(request1);
        expect(response1.status).toBe(200);

        // Second request immediately after (should be rate limited)
        const request2 = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Rate Test" }),
        });
        const response2 = await POST(request2);
        const data2 = await response2.json();

        expect(response2.status).toBe(429);
        expect(data2.error).toBe("Too many requests");
        expect(data2.message).toContain("wait");
        expect(data2.message).toMatch(/\d+ seconds/);
      });

      it("should apply rate limit per email address", async () => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        // First email
        const request1 = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: "user1@ku.th", studentName: "User 1" }),
        });
        const response1 = await POST(request1);
        expect(response1.status).toBe(200);

        // Second email (different address, should succeed)
        const request2 = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email: "user2@ku.th", studentName: "User 2" }),
        });
        const response2 = await POST(request2);
        expect(response2.status).toBe(200);
      });
    });

    // Group 3: Token Generation Tests (ASVS V2.7.1, V2.1.7)
    describe("Token Generation (ASVS V2.7.1, V2.1.7)", () => {
      beforeEach(() => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      });

      it("V2.7.1: should generate a verification code", async () => {
        const email = getUniqueEmail();
        (generateVerificationCode as jest.Mock).mockReturnValue("654321");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        await POST(request);

        expect(generateVerificationCode).toHaveBeenCalled();
        expect(prisma.email_verification_tokens.create).toHaveBeenCalledWith({
          data: {
            email,
            token: "654321",
            expires: expect.any(Date),
          },
        });
      });

      it("V2.1.7: should set token expiration time", async () => {
        const email = getUniqueEmail();
        const expiryDate = new Date(Date.now() + 900000); // 15 minutes
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(expiryDate);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        await POST(request);

        expect(getVerificationExpiry).toHaveBeenCalled();
        expect(prisma.email_verification_tokens.create).toHaveBeenCalledWith({
          data: {
            email,
            token: expect.any(String),
            expires: expiryDate,
          },
        });
      });

      it("should delete existing tokens before creating new one", async () => {
        const email = getUniqueEmail();
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        await POST(request);

        // Verify deleteMany was called
        expect(prisma.email_verification_tokens.deleteMany).toHaveBeenCalledWith({
          where: { email },
        });

        // Verify both deleteMany and create were called
        expect(prisma.email_verification_tokens.deleteMany).toHaveBeenCalled();
        expect(prisma.email_verification_tokens.create).toHaveBeenCalled();
      });
    });

    // Group 4: Email Sending Tests
    describe("Email Sending", () => {
      beforeEach(() => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
      });

      it("should send verification email with code", async () => {
        const email = getUniqueEmail();
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "John Doe" }),
        });

        await POST(request);

        expect(sendVerificationEmail).toHaveBeenCalledWith(
          email,
          "123456",
          "John Doe"
        );
      });

      it("should handle email sending failure and clean up token", async () => {
        const email = getUniqueEmail();
        (sendVerificationEmail as jest.Mock).mockRejectedValue(
          new Error("SMTP connection failed")
        );

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to send verification email");
        expect(data.message).toContain("try again later");

        // Should clean up the token when email fails
        expect(prisma.email_verification_tokens.deleteMany).toHaveBeenCalledWith({
          where: { email, token: "123456" },
        });
      });

      it("V9.1.1: should not expose email service errors to user", async () => {
        const email = getUniqueEmail();
        (sendVerificationEmail as jest.Mock).mockRejectedValue(
          new Error("SMTP connection to mail.ku.th failed: timeout")
        );

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to send verification email");
        // Should NOT expose SMTP details
        expect(data.error).not.toContain("SMTP");
        expect(data.error).not.toContain("mail.ku.th");
        expect(data.error).not.toContain("timeout");
      });
    });

    // Group 5: Success Cases
    describe("Success Cases", () => {
      beforeEach(() => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      });

      it("should return success response with all required fields", async () => {
        const email = getUniqueEmail();
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test User" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          message: "Verification code sent to your email",
          expiresIn: "15 minutes",
        });
      });

      it("should handle email with studentName", async () => {
        const email = getUniqueEmail();
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Jane Smith" }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(sendVerificationEmail).toHaveBeenCalledWith(
          email,
          "123456",
          "Jane Smith"
        );
      });

      it("should handle email without studentName", async () => {
        const email = getUniqueEmail();
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(sendVerificationEmail).toHaveBeenCalledWith(
          email,
          "123456",
          undefined
        );
      });
    });

    // Group 6: Error Handling (ASVS V9.1.1)
    describe("Error Handling (ASVS V9.1.1)", () => {
      it("V9.1.1: should handle database errors gracefully", async () => {
        (prisma.student.findFirst as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const email = getUniqueEmail();
        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
        // Should NOT expose internal error details
        expect(data).not.toHaveProperty("stack");
        expect(data.error).not.toContain("Database");
      });

      it("should handle token creation errors gracefully", async () => {
        const email = getUniqueEmail();
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockRejectedValue(
          new Error("Unique constraint violation")
        );

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });

    // Group 7: Performance Tests
    describe("Performance", () => {
      beforeEach(() => {
        (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);
        (isValidKUEmail as jest.Mock).mockReturnValue(true);
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
        (getVerificationExpiry as jest.Mock).mockReturnValue(new Date(Date.now() + 900000));
        (prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({});
        (prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({});
        (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      });

      it("should respond within acceptable time", async () => {
        const email = getUniqueEmail();
        const startTime = Date.now();

        const request = new NextRequest("http://localhost:3000/api/students/send-verification", {
          method: "POST",
          body: JSON.stringify({ email, studentName: "Test" }),
        });

        const response = await POST(request);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(1000); // 1000ms threshold (email sending can be slow)
      });
    });
  });
});
