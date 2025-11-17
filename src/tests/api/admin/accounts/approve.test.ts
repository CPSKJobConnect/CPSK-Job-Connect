/**
 * Tests for POST /api/admin/accounts/approve
 * Tests admin approval/rejection of student and company accounts
 */

import { POST } from "@/app/api/admin/accounts/approve/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { sendAlumniStatusEmail, sendCompanyStatusEmail } from "@/lib/email";

// Mock modules
jest.mock("@/lib/db", () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    student: { findFirst: jest.fn(), update: jest.fn() },
    company: { findFirst: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
  sendAlumniStatusEmail: jest.fn(),
  sendCompanyStatusEmail: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
}));

// Polyfill Request for Node.js environment
(global as any).Request = class {
  url: string;
  method: string;
  body: any;

  constructor(url: string, init?: any) {
    this.url = url || "http://localhost";
    this.method = init?.method || "GET";
    this.body = init?.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Silence console logs
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("POST /api/admin/accounts/approve", () => {
  const mockAdminAccount = {
    id: 1,
    email: "admin@example.com",
    accountRole: { name: "admin" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("returns 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 if user is not admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "user@example.com" },
      });

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        email: "user@example.com",
        accountRole: { name: "student" },
      });

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("returns 400 if accountId is missing", async () => {
      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("returns 400 if action is invalid", async () => {
      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "invalid" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("returns 400 if accountType is invalid", async () => {
      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "invalid", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account type");
    });
  });

  describe("Student Approval", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("approves a student successfully", async () => {
      const mockStudent = {
        id: 1,
        name: "John Doe",
        account_id: 10,
        account: { email: "john@example.com" },
      };

      (prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.student.update as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
      (sendAlumniStatusEmail as jest.Mock).mockResolvedValue(undefined);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("approved");
      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            verification_status: "APPROVED",
          }),
        })
      );
      expect(sendAlumniStatusEmail).toHaveBeenCalledWith("john@example.com", "John Doe", true, undefined);
    });

    it("rejects a student with reason", async () => {
      const mockStudent = {
        id: 1,
        name: "John Doe",
        account_id: 10,
        account: { email: "john@example.com" },
      };

      (prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.student.update as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
      (sendAlumniStatusEmail as jest.Mock).mockResolvedValue(undefined);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({
          accountId: 1,
          accountType: "student",
          action: "reject",
          reason: "Invalid documents",
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("rejected");
      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verification_status: "REJECTED",
            verification_notes: "Invalid documents",
            email_verified: false,
          }),
        })
      );
      expect(sendAlumniStatusEmail).toHaveBeenCalledWith("john@example.com", "John Doe", false, "Invalid documents");
    });

    it("returns 404 if student not found", async () => {
      (prisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 999, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Company Approval", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("approves a company successfully", async () => {
      const mockCompany = {
        id: 1,
        name: "Tech Corp",
        account_id: 20,
        account: { email: "contact@techcorp.com" },
      };

      (prisma.company.findFirst as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.company.update as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
      (sendCompanyStatusEmail as jest.Mock).mockResolvedValue(undefined);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "company", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("approved");
      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            registration_status: "APPROVED",
          }),
        })
      );
      expect(sendCompanyStatusEmail).toHaveBeenCalledWith("contact@techcorp.com", "Tech Corp", true, undefined);
    });

    it("returns 404 if company not found", async () => {
      (prisma.company.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 999, accountType: "company", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAdminAccount);
    });

    it("handles database errors gracefully", async () => {
      (prisma.student.findFirst as jest.Mock).mockRejectedValue(new Error("DB connection failed"));

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update account status");
    });

    it("continues even if email sending fails", async () => {
      const mockStudent = {
        id: 1,
        name: "John Doe",
        account_id: 10,
        account: { email: "john@example.com" },
      };

      (prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.student.update as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
      (sendAlumniStatusEmail as jest.Mock).mockRejectedValue(new Error("Email service down"));

      const req = new Request("http://localhost/api/admin/accounts/approve", {
        method: "POST",
        body: JSON.stringify({ accountId: 1, accountType: "student", action: "approve" }),
      });

      const res = await POST(req);
      const data = await res.json();

      // Should still succeed even if email fails
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
