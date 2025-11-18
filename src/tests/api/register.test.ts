/**
 * Tests for Registration API
 *
 * Endpoint:
 * - POST /api/register - Register new student or company account
 *
 * ASVS Coverage:
 * - V2: Authentication & Password Management
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection
 */

import { POST } from "@/app/api/register/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { uploadDocument } from "@/lib/uploadDocument";
import { notifyAdminsNewAlumni, notifyAdminsNewCompany } from "@/lib/notifyAdmins";
import bcrypt from "bcryptjs";

// Import fixtures
import { mockStudentAccount, mockCompanyAccount } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    accountRole: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    student: {
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/uploadDocument", () => ({
  uploadDocument: jest.fn(),
}));

jest.mock("@/lib/notifyAdmins", () => ({
  notifyAdminsNewAlumni: jest.fn(),
  notifyAdminsNewCompany: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
  NextRequest: jest.requireActual("next/server").NextRequest,
}));

// Silence console logs
silenceConsole();

// ============================================================================
// POST /api/register
// ============================================================================

describe("POST /api/register", () => {
  beforeEach(() => {
    resetAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
  });

  // Helper to create FormData for student registration
  const createStudentFormData = (overrides: Record<string, any> = {}) => {
    const formData = new FormData();
    formData.append("role", "student");
    formData.append("email", overrides.email || "student@ku.th");
    formData.append("password", overrides.password || "SecurePass123!");
    formData.append("confirmPassword", overrides.confirmPassword || overrides.password || "SecurePass123!");
    formData.append("name", overrides.name || "John Doe");
    formData.append("studentId", overrides.studentId || "6510000000");
    formData.append("faculty", overrides.faculty || "Software and Knowledge Engineering (SKE)");
    formData.append("year", overrides.year !== undefined ? overrides.year : "2");
    formData.append("phone", overrides.phone || "0812345678");
    formData.append("studentStatus", overrides.studentStatus || "CURRENT");

    if (overrides.transcript) {
      formData.append("transcript", overrides.transcript);
    }

    return formData;
  };

  // Helper to create FormData for company registration
  const createCompanyFormData = (overrides: Record<string, any> = {}) => {
    const formData = new FormData();
    formData.append("role", "company");
    formData.append("email", overrides.email || "company@example.com");
    formData.append("password", overrides.password || "SecurePass123!");
    formData.append("confirmPassword", overrides.confirmPassword || overrides.password || "SecurePass123!");
    formData.append("companyName", overrides.companyName || "Tech Corp");
    formData.append("address", overrides.address || "123 Tech St");
    formData.append("phone", overrides.phone || "0212345678");
    formData.append("description", overrides.description || "We are a leading technology company providing innovative solutions to businesses.");
    formData.append("website", overrides.website !== undefined ? overrides.website : "https://techcorp.example.com");

    if (overrides.evidence) {
      formData.append("evidence", overrides.evidence);
    }

    return formData;
  };

  // Helper to create mock file
  const createMockFile = (name: string = "test.pdf", size: number = 1000) => {
    const blob = new Blob(["test content"], { type: "application/pdf" });
    return new File([blob], name, { type: "application/pdf" });
  };

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("Input Validation", () => {
    it("returns 400 for invalid role", async () => {
      const formData = new FormData();
      formData.append("role", "invalid");

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid role");
    });

    it("returns 400 for missing role", async () => {
      const formData = new FormData();
      formData.append("email", "test@ku.th");

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid role");
    });
  });

  // ==========================================================================
  // STUDENT REGISTRATION TESTS
  // ==========================================================================

  describe("Student Registration", () => {
    beforeEach(() => {
      (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.accountRole.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue(mockStudentAccount);
      (prisma.student.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.student.update as jest.Mock).mockResolvedValue({ id: 1, transcript: "test.pdf" });
      (uploadDocument as jest.Mock).mockResolvedValue({ id: 1, file_path: "test.pdf" });
      (notifyAdminsNewAlumni as jest.Mock).mockResolvedValue(undefined);

      // Mock $transaction to execute the callback with a mock transaction context
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const tx = {
          account: {
            create: jest.fn().mockResolvedValue(mockStudentAccount),
            update: jest.fn().mockResolvedValue(mockStudentAccount),
          },
          student: {
            create: jest.fn().mockResolvedValue({ id: 1, account_id: mockStudentAccount.id }),
          },
          company: {
            create: jest.fn().mockResolvedValue({ id: 1, account_id: 2 }),
          },
        };
        return await callback(tx);
      });
    });

    it("registers a new student successfully", async () => {
      const formData = createStudentFormData();
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("created successfully");
      expect(data).toHaveProperty("redirectTo", "/student/dashboard");
    });

    it("returns 400 if email already exists", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockStudentAccount,
        student: { id: 1, account_id: 1 }, // Account has complete student registration
      });

      const formData = createStudentFormData();
      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("already exists");
    });

    it("validates required student fields", async () => {
      const formData = new FormData();
      formData.append("role", "student");
      formData.append("email", "student@ku.th");
      // Missing required fields

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);

      expect(res.status).toBe(400);
    });

    it("handles Alumni registration correctly", async () => {
      const formData = createStudentFormData({
        year: "Alumni",
        studentStatus: "ALUMNI"
      });
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);

      expect(res.status).toBe(201);
      expect(notifyAdminsNewAlumni).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // COMPANY REGISTRATION TESTS
  // ==========================================================================

  describe("Company Registration", () => {
    beforeEach(() => {
      (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: "company" });
      (prisma.accountRole.findUnique as jest.Mock).mockResolvedValue({ id: 2, name: "company" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue(mockCompanyAccount);
      (prisma.company.create as jest.Mock).mockResolvedValue({ id: 1 });
      (uploadDocument as jest.Mock).mockResolvedValue({ id: 1, file_path: "evidence.pdf" });
      (notifyAdminsNewCompany as jest.Mock).mockResolvedValue(undefined);

      // Mock $transaction to execute the callback with a mock transaction context
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const tx = {
          account: {
            create: jest.fn().mockResolvedValue(mockCompanyAccount),
            update: jest.fn().mockResolvedValue(mockCompanyAccount),
          },
          student: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          company: {
            create: jest.fn().mockResolvedValue({ id: 1, account_id: mockCompanyAccount.id }),
          },
        };
        return await callback(tx);
      });
    });

    it("registers a new company successfully", async () => {
      const formData = createCompanyFormData();
      const evidenceFile = createMockFile("evidence.pdf");
      formData.append("evidence", evidenceFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("created successfully");
      expect(data).toHaveProperty("redirectTo", "/company/dashboard");
      expect(notifyAdminsNewCompany).toHaveBeenCalled();
    });

    it("returns 400 if company email already exists", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockCompanyAccount,
        company: { id: 1, account_id: 2 }, // Account has complete company registration
      });

      const formData = createCompanyFormData();
      const evidenceFile = createMockFile("evidence.pdf");
      formData.append("evidence", evidenceFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("already exists");
    });

    it("validates required company fields", async () => {
      const formData = new FormData();
      formData.append("role", "company");
      formData.append("email", "company@example.com");
      // Missing required fields

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);

      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // OAUTH REGISTRATION TESTS
  // ==========================================================================

  describe("OAuth Registration", () => {
    it("requires session for OAuth registration", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const formData = createStudentFormData();
      formData.append("isOAuth", "true");

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("OAuth session required");
    });

    it("allows OAuth registration with valid session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "oauth@ku.th" }
      });
      (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.accountRole.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue(mockStudentAccount);
      (prisma.student.create as jest.Mock).mockResolvedValue({ id: 1 });

      // Mock $transaction to execute the callback with a mock transaction context
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const tx = {
          account: {
            create: jest.fn().mockResolvedValue(mockStudentAccount),
            update: jest.fn().mockResolvedValue(mockStudentAccount),
          },
          student: {
            create: jest.fn().mockResolvedValue({ id: 1, account_id: mockStudentAccount.id }),
          },
          company: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return await callback(tx);
      });

      const formData = createStudentFormData({ email: "oauth@ku.th" });
      formData.append("isOAuth", "true");
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);

      expect(res.status).toBe(201);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.accountRole.findFirst as jest.Mock).mockRejectedValue(new Error("DB error"));

      const formData = createStudentFormData();
      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("handles file upload errors", async () => {
      (prisma.accountRole.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (uploadDocument as jest.Mock).mockRejectedValue(new Error("Upload failed"));

      const formData = createStudentFormData();
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);

      expect(res.status).toBe(500);
    });

    it("does not expose sensitive error details", async () => {
      (prisma.accountRole.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database connection string leaked")
      );

      const formData = createStudentFormData();
      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req as any);
      const data = await res.json();

      expect(data.error).toBe("Internal server error");
      expect(data.error).not.toContain("database");
      expect(data.error).not.toContain("connection");
    });
  });

  // ==========================================================================
  // PASSWORD SECURITY TESTS
  // ==========================================================================

  describe("Password Security", () => {
    let txAccountCreateMock: jest.Mock;

    beforeEach(() => {
      (prisma.accountRole.findFirst as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.accountRole.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: "student" });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue(mockStudentAccount);
      (prisma.student.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.student.update as jest.Mock).mockResolvedValue({ id: 1, transcript: "test.pdf" });
      (uploadDocument as jest.Mock).mockResolvedValue({ id: 1, file_path: "test.pdf" });

      // Mock $transaction with trackable account.create
      txAccountCreateMock = jest.fn().mockResolvedValue(mockStudentAccount);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const tx = {
          account: {
            create: txAccountCreateMock,
            update: jest.fn().mockResolvedValue(mockStudentAccount),
          },
          student: {
            create: jest.fn().mockResolvedValue({ id: 1, account_id: mockStudentAccount.id }),
          },
          company: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return await callback(tx);
      });
    });

    it("hashes passwords before storing", async () => {
      const formData = createStudentFormData({ password: "PlainTextPassword123!" });
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      await POST(req as any);

      expect(bcrypt.hash).toHaveBeenCalledWith("PlainTextPassword123!", 12);
      expect(txAccountCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: "hashed_password"
          })
        })
      );
    });

    it("does not store OAuth passwords", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "oauth@ku.th" }
      });

      const formData = createStudentFormData({ email: "oauth@ku.th" });
      formData.append("isOAuth", "true");
      formData.delete("password"); // OAuth registration shouldn't need password
      const transcriptFile = createMockFile("transcript.pdf");
      formData.append("transcript", transcriptFile);

      const req = new Request("http://localhost/api/register", {
        method: "POST",
        body: formData,
      });

      await POST(req as any);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });
});
