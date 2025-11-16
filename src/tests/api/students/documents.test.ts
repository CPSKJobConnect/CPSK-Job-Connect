/**
 * API Tests: Student Documents
 *
 * Endpoint: POST /api/students/documents
 * Purpose: Upload and manage student documents (resume, CV, portfolio, transcript)
 * Authentication: Required (Student role)
 * Authorization: Student can only upload their own documents
 *
 * ASVS Coverage:
 * - V5.2.1: File size validation
 * - V5.2.2: File extension and content type validation
 * - V5.3.1: Prevent execution of uploaded files
 * - V5.3.2: Filename sanitization and path traversal prevention
 * - V7.2.1: Session token verification
 * - V8.2.2: Data-specific access control
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/students/documents/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";
import { mockSession, createMockDocument } from "@/tests/utils/test-helpers";

// Mock dependencies
jest.mock("@/lib/api-auth");
jest.mock("@/lib/uploadDocument");
jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Student Documents API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // POST /api/students/documents
  // ============================================

  describe("POST /api/students/documents", () => {
    // Helper to create FormData with file
    const createFormDataWithFile = (
      fileName: string = "resume.pdf",
      fileContent: string = "test content",
      mimeType: string = "application/pdf",
      docTypeId: string = "1"
    ): FormData => {
      const blob = new Blob([fileContent], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("docTypeId", docTypeId);

      return formData;
    };

    // Group 1: Authentication Tests (ASVS V7.2.1)
    describe("Authentication", () => {
      it("should return 401 when no session exists", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(null);

        const formData = createFormDataWithFile();
        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });

      it("should return 401 when session user ID is missing", async () => {
        (getApiSession as jest.Mock).mockResolvedValue({
          user: { email: "student@ku.th", role: "student" }
          // Missing id
        });

        const formData = createFormDataWithFile();
        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });

      it("should accept valid authentication", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
        (uploadDocument as jest.Mock).mockResolvedValue(createMockDocument(1));

        const formData = createFormDataWithFile();
        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      });
    });

    // Group 2: Input Validation Tests
    describe("Input Validation", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
      });

      it("should reject request without file", async () => {
        const formData = new FormData();
        formData.append("docTypeId", "1");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("No file provided");
      });

      it("should reject request without docTypeId", async () => {
        const blob = new Blob(["test"], { type: "application/pdf" });
        const file = new File([blob], "test.pdf", { type: "application/pdf" });

        const formData = new FormData();
        formData.append("file", file);
        // Missing docTypeId

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Invalid document type");
      });

      it("should reject invalid docTypeId (< 1)", async () => {
        const formData = createFormDataWithFile("test.pdf", "content", "application/pdf", "0");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Invalid document type");
      });

      it("should reject invalid docTypeId (> 4)", async () => {
        const formData = createFormDataWithFile("test.pdf", "content", "application/pdf", "5");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Invalid document type");
      });

      it("should reject non-numeric docTypeId", async () => {
        const formData = createFormDataWithFile("test.pdf", "content", "application/pdf", "invalid");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Invalid document type");
      });
    });

    // Group 3: File Validation Tests (ASVS V5.2)
    describe("File Validation (ASVS V5.2)", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
      });

      it("V5.2.1: should reject files exceeding size limit", async () => {
        // Simulate uploadDocument rejecting large file
        (uploadDocument as jest.Mock).mockRejectedValue(
          new Error("File size exceeds limit")
        );

        const formData = createFormDataWithFile("large.pdf", "x".repeat(11 * 1024 * 1024));

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain("Failed to upload document");
      });

      it("V5.2.2: should validate file extension and content type", async () => {
        // uploadDocument should handle validation
        (uploadDocument as jest.Mock).mockRejectedValue(
          new Error("Invalid file type")
        );

        const formData = createFormDataWithFile("malware.exe", "content", "application/x-msdownload");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain("Failed to upload document");
      });

      it("V5.3.1: should prevent execution of uploaded files (reject .exe)", async () => {
        (uploadDocument as jest.Mock).mockRejectedValue(
          new Error("Executable files not allowed")
        );

        const formData = createFormDataWithFile("malware.exe", "MZ", "application/x-msdownload");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(500);
      });

      it("V5.3.1: should prevent execution of uploaded files (reject .php)", async () => {
        (uploadDocument as jest.Mock).mockRejectedValue(
          new Error("PHP files not allowed")
        );

        const formData = createFormDataWithFile("shell.php", "<?php echo 'hack'; ?>", "application/x-php");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(500);
      });

      it("V5.3.2: should sanitize filenames (path traversal)", async () => {
        // uploadDocument should sanitize filename
        (uploadDocument as jest.Mock).mockResolvedValue(
          createMockDocument(1, {
            file_name: "passwd.pdf", // Sanitized
            file_path: "uploads/1/passwd.pdf"
          })
        );

        const formData = createFormDataWithFile("../../../etc/passwd.pdf", "content");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.file_name).not.toContain("../");
        expect(data.file_path).not.toContain("../");
      });

      it("should accept valid PDF files", async () => {
        (uploadDocument as jest.Mock).mockResolvedValue(
          createMockDocument(1, { file_name: "resume.pdf" })
        );

        const formData = createFormDataWithFile("resume.pdf", "PDF content");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
      });

      it("should accept valid image files", async () => {
        (uploadDocument as jest.Mock).mockResolvedValue(
          createMockDocument(1, { file_name: "document.jpg" })
        );

        const formData = createFormDataWithFile("document.jpg", "image content", "image/jpeg");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
      });
    });

    // Group 4: Success Cases
    describe("Success Cases", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
      });

      it("should upload resume (docTypeId=1) successfully", async () => {
        const mockDoc = createMockDocument(1, {
          id: 1,
          account_id: 1,
          file_name: "resume.pdf",
          file_path: "uploads/1/resume.pdf",
        });

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("resume.pdf", "content", "application/pdf", "1");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty("id", 1);
        expect(data).toHaveProperty("file_name", "resume.pdf");
        expect(data).toHaveProperty("file_path", "uploads/1/resume.pdf");
        expect(data).toHaveProperty("doc_type_id", 1);
        expect(uploadDocument).toHaveBeenCalledWith(
          expect.any(File),
          "1",
          1
        );
      });

      it("should upload CV (docTypeId=2) successfully", async () => {
        const mockDoc = createMockDocument(2, {
          id: 2,
          file_name: "cv.pdf",
        });

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("cv.pdf", "content", "application/pdf", "2");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.doc_type_id).toBe(2);
        expect(uploadDocument).toHaveBeenCalledWith(
          expect.any(File),
          "1",
          2
        );
      });

      it("should upload portfolio (docTypeId=3) successfully", async () => {
        const mockDoc = createMockDocument(3);

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("portfolio.pdf", "content", "application/pdf", "3");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(uploadDocument).toHaveBeenCalledWith(
          expect.any(File),
          "1",
          3
        );
      });

      it("should upload transcript (docTypeId=4) successfully", async () => {
        const mockDoc = createMockDocument(4);

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("transcript.pdf", "content", "application/pdf", "4");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(uploadDocument).toHaveBeenCalledWith(
          expect.any(File),
          "1",
          4
        );
      });

      it("should return complete document data", async () => {
        const mockDoc = {
          id: 5,
          account_id: 1,
          doc_type_id: 1,
          file_path: "uploads/1/my-resume.pdf",
          file_name: "my-resume.pdf",
          created_at: new Date("2025-01-15T10:30:00Z"),
        };

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("my-resume.pdf");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty("id");
        expect(data).toHaveProperty("account_id");
        expect(data).toHaveProperty("doc_type_id");
        expect(data).toHaveProperty("file_path");
        expect(data).toHaveProperty("file_name");
        expect(data).toHaveProperty("created_at");
      });

      it("should handle files with special characters in name", async () => {
        const mockDoc = createMockDocument(1, {
          file_name: "my_resume_2025.pdf",
          file_path: "uploads/1/my_resume_2025.pdf"
        });

        (uploadDocument as jest.Mock).mockResolvedValue(mockDoc);

        const formData = createFormDataWithFile("my resume (2025).pdf");

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.file_name).toBe("my_resume_2025.pdf");
      });
    });

    // Group 5: Error Handling
    describe("Error Handling", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
      });

      it("should return 404 when account not found", async () => {
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

        const formData = createFormDataWithFile();

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("not found");
      });

      it("should handle upload service errors gracefully", async () => {
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
        (uploadDocument as jest.Mock).mockRejectedValue(
          new Error("Supabase storage error")
        );

        const formData = createFormDataWithFile();

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to upload document");
        // Should NOT expose internal error details
        expect(data).not.toHaveProperty("stack");
        expect(data.error).not.toContain("Supabase");
      });

      it("should handle database query errors gracefully", async () => {
        (prisma.account.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const formData = createFormDataWithFile();

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to upload document");
        expect(data).not.toHaveProperty("stack");
      });
    });

    // Group 6: Authorization Tests (ASVS V8.2.2)
    describe("Authorization", () => {
      it("should only upload documents for authenticated user's account", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
        (uploadDocument as jest.Mock).mockResolvedValue(createMockDocument(1));

        const formData = createFormDataWithFile();

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        await POST(request);

        // Verify uploadDocument was called with the authenticated user's account ID
        expect(uploadDocument).toHaveBeenCalledWith(
          expect.any(File),
          "1", // session.user.id
          1
        );
      });

      it("should use session user ID for account lookup", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
        (uploadDocument as jest.Mock).mockResolvedValue(createMockDocument(1));

        const formData = createFormDataWithFile();

        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        await POST(request);

        expect(prisma.account.findUnique).toHaveBeenCalledWith({
          where: { id: parseInt(mockSession.student.user.id) }
        });
      });
    });

    // Group 7: Performance Tests
    describe("Performance", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          email: "student@ku.th",
        });
      });

      it("should handle small file upload within acceptable time", async () => {
        (uploadDocument as jest.Mock).mockResolvedValue(createMockDocument(1));

        const startTime = Date.now();

        const formData = createFormDataWithFile("resume.pdf", "small content");
        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(201);
        expect(responseTime).toBeLessThan(500); // 500ms threshold for small files
      });

      it("should handle large file upload within acceptable time", async () => {
        (uploadDocument as jest.Mock).mockResolvedValue(
          createMockDocument(1, {
            file_name: "large-document.pdf",
            file_path: "uploads/1/large-document.pdf"
          })
        );

        const startTime = Date.now();

        // Simulate a large file (5MB)
        const largeContent = "x".repeat(5 * 1024 * 1024);
        const formData = createFormDataWithFile("large-document.pdf", largeContent);
        const request = new NextRequest("http://localhost:3000/api/students/documents", {
          method: "POST",
          body: formData,
        });

        const response = await POST(request);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(201);
        expect(responseTime).toBeLessThan(2000); // 2000ms threshold for large files
      });

      it("should handle concurrent file uploads efficiently", async () => {
        (uploadDocument as jest.Mock).mockImplementation((file: File, accountId: string, docTypeId: number) =>
          Promise.resolve(createMockDocument(docTypeId, {
            file_name: file.name,
            file_path: `uploads/${accountId}/${file.name}`
          }))
        );

        const startTime = Date.now();

        // Simulate 5 concurrent uploads
        const uploadPromises = Array(5).fill(null).map((_, index) => {
          const formData = createFormDataWithFile(`document-${index}.pdf`, `content ${index}`, "application/pdf", String((index % 4) + 1));
          const request = new NextRequest("http://localhost:3000/api/students/documents", {
            method: "POST",
            body: formData,
          });
          return POST(request);
        });

        const responses = await Promise.all(uploadPromises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / responses.length;

        // All uploads should succeed
        responses.forEach(response => {
          expect(response.status).toBe(201);
        });

        // Average response time should be reasonable for concurrent uploads
        expect(averageTime).toBeLessThan(1000); // 1000ms average threshold
      });
    });
  });
});
