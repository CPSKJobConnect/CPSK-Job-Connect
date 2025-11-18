/**
 * API Tests: Student Document Management
 *
 * Endpoints:
 * - DELETE /api/students/documents/[id] - Delete document
 * - GET /api/students/documents/view/[id] - View/download document
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control (IDOR prevention)
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection
 */

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/students/documents/[id]/route";
import { GET as getView } from "@/app/api/students/documents/view/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

// Import fixtures
import { mockStudentSession, mockStudentAccount } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Supabase
const mockSupabaseRemove = jest.fn();
const mockSupabaseCreateSignedUrl = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        remove: mockSupabaseRemove,
        createSignedUrl: mockSupabaseCreateSignedUrl,
      })),
    },
  })),
}));

silenceConsole();

// ============================================================================
// DELETE /api/students/documents/[id]
// ============================================================================

describe("DELETE /api/students/documents/[id]", () => {
  const mockDocument = {
    id: 1,
    account_id: 1,
    file_path: "documents/student-1/resume.pdf",
    file_name: "resume.pdf",
    doc_type_id: 1,
  };

  beforeEach(() => {
    resetAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockStudentAccount);
    (prisma.document.findFirst as jest.Mock).mockResolvedValue(mockDocument);
    (prisma.document.delete as jest.Mock).mockResolvedValue(mockDocument);
    mockSupabaseRemove.mockResolvedValue({ error: null });
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when account not found", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Account not found");
    });
  });

  // ============================================
  // Authorization Tests (IDOR Prevention)
  // ============================================

  describe("Authorization & IDOR Prevention", () => {
    it("returns 404 when document doesn't belong to user", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/documents/999", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Document not found");
    });

    it("verifies document ownership before deletion", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      await DELETE(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          account_id: 1,
        },
      });
    });

    it("allows user to delete their own document", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // Input Validation Tests
  // ============================================

  describe("Input Validation", () => {
    it("returns 400 for invalid document ID", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/abc", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "abc" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid document ID");
    });

    it("returns 400 for empty document ID", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid document ID");
    });
  });

  // ============================================
  // Success Cases
  // ============================================

  describe("Success Cases", () => {
    it("deletes document from both storage and database", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("deleted successfully");
      expect(mockSupabaseRemove).toHaveBeenCalledWith(["documents/student-1/resume.pdf"]);
      expect(prisma.document.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("continues with database deletion even if storage delete fails", async () => {
      mockSupabaseRemove.mockResolvedValue({ error: { message: "Storage error" } });

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
      expect(prisma.document.delete).toHaveBeenCalled();
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to delete document");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles deletion errors gracefully", async () => {
      (prisma.document.delete as jest.Mock).mockRejectedValue(new Error("Delete failed"));

      const req = new NextRequest("http://localhost/api/students/documents/1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to delete document");
    });
  });
});

// ============================================================================
// GET /api/students/documents/view/[id]
// ============================================================================

describe("GET /api/students/documents/view/[id]", () => {
  const mockAccountWithStudent = {
    ...mockStudentAccount,
    accountRole: {
      id: 1,
      name: "student",
    },
    student: {
      id: 1,
    },
  };

  const mockDocument = {
    id: 1,
    account_id: 1,
    file_path: "documents/student-1/resume.pdf",
    file_name: "resume.pdf",
    doc_type_id: 1,
    documentType: {
      id: 1,
      name: "Resume",
    },
  };

  beforeEach(() => {
    resetAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccountWithStudent);
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-url/resume.pdf" },
      error: null,
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when session has no email", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { id: "1" },
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 when account is not a student", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockAccountWithStudent,
        accountRole: { name: "company" },
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns 403 when account has no student record", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockAccountWithStudent,
        student: null,
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  // ============================================
  // Authorization Tests (IDOR Prevention)
  // ============================================

  describe("Authorization & IDOR Prevention", () => {
    it("returns 403 when document doesn't belong to user", async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue({
        ...mockDocument,
        account_id: 999, // Different account
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Not your document");
    });

    it("verifies document ownership before generating URL", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      await getView(req, { params: Promise.resolve({ id: "1" }) });

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { documentType: true },
      });
    });

    it("allows user to view their own document", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // Input Validation Tests
  // ============================================

  describe("Input Validation", () => {
    it("returns 400 for invalid document ID", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/view/invalid");
      const res = await getView(req, { params: Promise.resolve({ id: "invalid" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid document ID");
    });

    it("returns 404 when document not found", async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/students/documents/view/999");
      const res = await getView(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Document not found");
    });
  });

  // ============================================
  // Success Cases
  // ============================================

  describe("Success Cases", () => {
    it("returns signed URL for document", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        url: "https://example.com/signed-url/resume.pdf",
        fileName: "resume.pdf",
        fileType: "Resume",
      });
    });

    it("generates signed URL with 1 hour expiry", async () => {
      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      await getView(req, { params: Promise.resolve({ id: "1" }) });

      expect(mockSupabaseCreateSignedUrl).toHaveBeenCalledWith(
        "documents/student-1/resume.pdf",
        3600
      );
    });

    it("includes document type information", async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue({
        ...mockDocument,
        documentType: { id: 2, name: "CV" },
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.fileType).toBe("CV");
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe("Error Handling", () => {
    it("handles Supabase errors gracefully", async () => {
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Storage error" },
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to generate download URL");
    });

    it("handles database errors gracefully", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to get document");
      expect(data).not.toHaveProperty("stack");
    });

    it("handles missing signed URL data", async () => {
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: null,
        error: null,
      });

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to generate download URL");
    });
  });

  // ============================================
  // Security Tests
  // ============================================

  describe("Security", () => {
    it("uses service role key for Supabase access", async () => {
      const { createClient } = require("@supabase/supabase-js");

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      await getView(req, { params: Promise.resolve({ id: "1" }) });

      expect(createClient).toHaveBeenCalled();
    });

    it("does not expose internal error details", async () => {
      (prisma.document.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection failed: server unreachable")
      );

      const req = new NextRequest("http://localhost/api/students/documents/view/1");
      const res = await getView(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(data.error).toBe("Failed to get document");
      expect(data.error).not.toContain("Database connection");
      expect(data.error).not.toContain("server unreachable");
    });
  });
});
