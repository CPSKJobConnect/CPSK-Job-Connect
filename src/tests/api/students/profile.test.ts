/**
 * API Tests: Student Profile
 *
 * Endpoints:
 * - GET /api/students/profile - Get authenticated student's profile
 * - PUT /api/students/profile - Update authenticated student's profile
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation
 * - V7: Error Handling
 * - V8: Data Protection (IDOR prevention)
 */

import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/students/profile/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

// Import fixtures
import { mockStudentSession, mockStudent, createMockStudent } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Silence console logs
silenceConsole();

// ============================================================================
// GET /api/students/profile
// ============================================================================

describe("Student Profile API", () => {
  // Helper to create mock document
  const createMockDocument = (docTypeId: number = 1, overrides: any = {}) => {
    return {
      id: 1,
      account_id: 1,
      doc_type_id: docTypeId,
      file_path: `uploads/1/document-${docTypeId}.pdf`,
      file_name: `document-${docTypeId}.pdf`,
      created_at: new Date("2025-01-01"),
      ...overrides
    };
  };

  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // GET /api/students/profile
  // ============================================

  describe("GET /api/students/profile", () => {
    // Group 1: Authentication Tests (ASVS V7.2.1)
    describe("Authentication", () => {
      it("should return 401 when no session exists", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toHaveProperty("error");
        expect(data.error).toContain("Unauthorized");
      });

      it("should return 401 when session user ID is missing", async () => {
        (getApiSession as jest.Mock).mockResolvedValue({
          user: { email: "student@ku.th", role: "student" }
          // Missing id
        });

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });

      it("should accept valid authentication", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);

        expect(response.status).toBe(200);
      });
    });

    // Group 2: Success Cases
    describe("Success Cases", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      });

      it("should return complete profile data with all required fields", async () => {
        const mockStudent = createMockStudent({
          name: "John Doe Smith",
          year: "2",
          account: {
            id: 1,
            email: "john@ku.th",
            logoUrl: "https://example.com/photo.jpg",
            backgroundUrl: "https://example.com/bg.jpg",
            documents: [
              createMockDocument(1, { file_name: "resume.pdf" }),
              createMockDocument(2, { file_name: "cv.pdf" }),
            ]
          }
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty("id", 1);
        expect(data).toHaveProperty("account_id", 1);
        expect(data).toHaveProperty("email", "john@ku.th");
        expect(data).toHaveProperty("role", "student");
        expect(data).toHaveProperty("student_id", "b6410000000");
        expect(data).toHaveProperty("firstname", "John");
        expect(data).toHaveProperty("lastname", "Doe Smith");
        expect(data).toHaveProperty("faculty", "Software and Knowledge Engineering (SKE)");
        expect(data).toHaveProperty("year", 2);
        expect(data).toHaveProperty("phone", "0812345678");
        expect(data).toHaveProperty("student_status", "CURRENT");
        expect(data).toHaveProperty("verification_status", "APPROVED");
        expect(data).toHaveProperty("email_verified", true);
        expect(data).toHaveProperty("profile_url", "https://example.com/photo.jpg");
        expect(data).toHaveProperty("bg_profile_url", "https://example.com/bg.jpg");
        expect(data).toHaveProperty("documents");
      });

      it("should correctly split name into firstname and lastname", async () => {
        const mockStudent = createMockStudent({
          name: "Alice Bob Charlie"
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.firstname).toBe("Alice");
        expect(data.lastname).toBe("Bob Charlie");
      });

      it("should handle single-word names", async () => {
        const mockStudent = createMockStudent({
          name: "Madonna"
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.firstname).toBe("Madonna");
        expect(data.lastname).toBe("");
      });

      it("should handle Alumni year correctly", async () => {
        const mockStudent = createMockStudent({
          year: "Alumni",
          student_status: "ALUMNI"
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.year).toBe("Alumni");
        expect(data.student_status).toBe("ALUMNI");
      });

      it("should convert numeric year string to number", async () => {
        const mockStudent = createMockStudent({
          year: "3"
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.year).toBe(3);
        expect(typeof data.year).toBe("number");
      });

      it("should organize documents by type correctly", async () => {
        const mockStudent = createMockStudent({
          account: {
            id: 1,
            email: "student@ku.th",
            logoUrl: null,
            backgroundUrl: null,
            documents: [
              createMockDocument(1, { id: 1, file_name: "resume.pdf" }),
              createMockDocument(1, { id: 2, file_name: "resume2.pdf" }),
              createMockDocument(2, { id: 3, file_name: "cv.pdf" }),
              createMockDocument(3, { id: 4, file_name: "portfolio.pdf" }),
              createMockDocument(4, { id: 5, file_name: "transcript.pdf" }),
            ]
          }
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.documents).toHaveProperty("resume");
        expect(data.documents).toHaveProperty("cv");
        expect(data.documents).toHaveProperty("portfolio");
        expect(data.documents).toHaveProperty("transcript");

        expect(data.documents.resume).toHaveLength(2);
        expect(data.documents.cv).toHaveLength(1);
        expect(data.documents.portfolio).toHaveLength(1);
        expect(data.documents.transcript).toHaveLength(1);

        // Check document structure
        expect(data.documents.resume[0]).toHaveProperty("id");
        expect(data.documents.resume[0]).toHaveProperty("url");
        expect(data.documents.resume[0]).toHaveProperty("name");
        expect(data.documents.resume[0]).toHaveProperty("uploadedAt");
      });

      it("should handle empty documents array", async () => {
        const mockStudent = createMockStudent({
          account: {
            id: 1,
            email: "student@ku.th",
            logoUrl: null,
            backgroundUrl: null,
            documents: []
          }
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.documents.resume).toEqual([]);
        expect(data.documents.cv).toEqual([]);
        expect(data.documents.portfolio).toEqual([]);
        expect(data.documents.transcript).toEqual([]);
      });

      it("should handle null logoUrl and backgroundUrl", async () => {
        const mockStudent = createMockStudent({
          account: {
            id: 1,
            email: "student@ku.th",
            logoUrl: null,
            backgroundUrl: null,
            documents: []
          }
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(data.profile_url).toBe("");
        expect(data.bg_profile_url).toBe("");
      });
    });

    // Group 3: Error Handling
    describe("Error Handling", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      });

      it("should return 404 when student not found", async () => {
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("not found");
      });

      it("should handle database errors gracefully", async () => {
        (prisma.student.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch student profile");
        // Should NOT expose internal error details
        expect(data).not.toHaveProperty("stack");
        expect(data.error).not.toContain("Database connection lost");
      });
    });

    // Group 4: Content-Type Validation (ASVS V4.1.1)
    describe("Content-Type Header", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
      });

      it("should return correct Content-Type header", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);

        const contentType = response.headers.get("content-type");
        expect(contentType).toContain("application/json");
      });
    });

    // Group 5: Performance Tests
    describe("Performance", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
      });

      it("should respond within acceptable time for GET request", async () => {
        const startTime = Date.now();

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(500); // 500ms threshold for simple query
      });

      it("should handle GET request with large document arrays efficiently", async () => {
        // Mock student with many documents
        const mockStudentWithManyDocs = createMockStudent({
          account: {
            id: 1,
            email: "student@ku.th",
            logoUrl: null,
            backgroundUrl: null,
            documents: Array.from({ length: 50 }, (_, i) =>
              createMockDocument(((i % 4) + 1) as 1 | 2 | 3 | 4, { id: i + 1 })
            )
          }
        });

        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudentWithManyDocs);

        const startTime = Date.now();

        const request = new NextRequest("http://localhost:3000/api/students/profile");
        const response = await GET(request);
        const data = await response.json();

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(data.documents.resume.length).toBeGreaterThan(0);
        expect(responseTime).toBeLessThan(1000); // 1s threshold for complex data
      });

      it("should handle concurrent GET requests correctly", async () => {
        // Simulate 5 concurrent requests
        const requests = Array(5).fill(null).map(() =>
          GET(new NextRequest("http://localhost:3000/api/students/profile"))
        );

        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Average time per request should be reasonable
        const avgTime = totalTime / 5;
        expect(avgTime).toBeLessThan(600); // 600ms average
      });
    });
  });

  // ============================================
  // PUT /api/students/profile
  // ============================================

  describe("PUT /api/students/profile", () => {
    // Group 1: Authentication Tests
    describe("Authentication", () => {
      it("should return 401 when no session exists", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });
    });

    // Group 2: Input Validation Tests
    describe("Input Validation", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
      });

      it("should reject request with missing name field", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Missing name
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("required");
        expect(data.fields).toContain("name");
      });

      it("should reject request with empty name", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "   ", // Empty after trim
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.fields).toContain("name");
      });

      it("should reject request with missing faculty field", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            // Missing faculty
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.fields).toContain("faculty");
      });

      it("should reject request with missing year field", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            // Missing year
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.fields).toContain("year");
      });

      it("should reject request with missing phone field", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            year: 2
            // Missing phone
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.fields).toContain("phone");
      });

      it("should reject request with multiple missing fields", async () => {
        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User"
            // Missing faculty, year, phone
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("required");
        expect(data.fields).toContain("faculty");
        expect(data.fields).toContain("year");
        expect(data.fields).toContain("phone");
        expect(data.fields).toHaveLength(3);
      });

      it("should accept year = 0 as valid", async () => {
        (prisma.student.update as jest.Mock).mockResolvedValue(
          createMockStudent({ year: "0" })
        );

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            year: 0,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        expect(response.status).toBe(200);
      });
    });

    // Group 3: Success Cases
    describe("Success Cases", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(
          createMockStudent({ id: 1 })
        );
      });

      it("should update student profile successfully", async () => {
        const updatedStudent = createMockStudent({
          name: "Jane Smith",
          faculty: "Computer Engineering (CPE)",
          year: "3",
          phone: "0998765432"
        });

        (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Smith",
            faculty: "Computer Engineering (CPE)",
            year: 3,
            phone: "0998765432"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.firstname).toBe("Jane");
        expect(data.lastname).toBe("Smith");
        expect(data.faculty).toBe("Computer Engineering (CPE)");
        expect(data.year).toBe(3);
        expect(data.phone).toBe("0998765432");
      });

      it("should update account username along with student name", async () => {
        (prisma.student.update as jest.Mock).mockResolvedValue(
          createMockStudent({ name: "New Name" })
        );

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Name",
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        await PUT(request);

        expect(prisma.student.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            name: "New Name",
            faculty: "SKE",
            year: "2",
            phone: "0812345678",
            account: {
              update: {
                username: "New Name"
              }
            }
          },
          include: {
            account: {
              include: { documents: true }
            }
          }
        });
      });

      it("should handle Alumni year update correctly", async () => {
        const updatedStudent = createMockStudent({
          year: "Alumni",
          student_status: "ALUMNI"
        });

        (prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent);

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Alumni Student",
            faculty: "SKE",
            year: "Alumni",
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.year).toBe("Alumni");
      });
    });

    // Group 4: Error Handling
    describe("Error Handling", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      });

      it("should return 404 when student not found", async () => {
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("not found");
      });

      it("should handle database update errors gracefully", async () => {
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(
          createMockStudent({ id: 1 })
        );
        (prisma.student.update as jest.Mock).mockRejectedValue(
          new Error("Database update failed")
        );

        const request = new NextRequest("http://localhost:3000/api/students/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            faculty: "SKE",
            year: 2,
            phone: "0812345678"
          })
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update student profile");
        expect(data).not.toHaveProperty("stack");
      });
    });
  });
});
