/**
 * API Tests: Student Applications
 *
 * Endpoint: GET /api/students/applications
 * Purpose: Retrieve all job applications for the authenticated student
 * Authentication: Required (Student role)
 * Authorization: Student can only access their own applications
 *
 * ASVS Coverage:
 * - V7.2.1: Session token verification
 * - V8.2.1: Resource access control (own applications only)
 * - V8.2.2: Data-specific access control
 * - V9.1.1: Proper error messages without leaking information
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/students/applications/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { mockSession, createMockStudent } from "@/tests/utils/test-helpers";

// Mock dependencies
jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
    },
  },
}));

describe("Student Applications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // GET /api/students/applications
  // ============================================

  describe("GET /api/students/applications", () => {
    // Group 1: Authentication Tests (ASVS V7.2.1)
    describe("Authentication", () => {
      it("should return 401 when no session exists", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });

      it("should return 401 when session user ID is missing", async () => {
        (getApiSession as jest.Mock).mockResolvedValue({
          user: { email: "student@ku.th", role: "student" }
          // Missing id
        });

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("Unauthorized");
      });

      it("should accept valid authentication", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);

        expect(response.status).toBe(200);
      });
    });

    // Group 2: Authorization Tests (ASVS V8.2.1, V8.2.2)
    describe("Authorization", () => {
      it("should return 404 when student not found", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("Student not found");
      });

      it("V8.2.2: should only fetch applications for authenticated student", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        const mockStudent = createMockStudent({ id: 1 });
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        await GET(request);

        // Verify that findMany is called with the correct student_id
        expect(prisma.application.findMany).toHaveBeenCalledWith({
          where: { student_id: 1 },
          include: expect.objectContaining({
            jobPost: expect.any(Object),
            applicationStatus: true,
            resumeDocument: true,
            portfolioDocument: true,
            cvDocument: true,
            transcriptDocument: true,
          }),
          orderBy: { applied_at: 'desc' }
        });
      });

      it("should query student using session user ID", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        await GET(request);

        expect(prisma.student.findUnique).toHaveBeenCalledWith({
          where: { account_id: parseInt(mockSession.student.user.id) }
        });
      });
    });

    // Group 3: Business Logic Tests
    describe("Business Logic", () => {
      it("should return empty array when student has no applications", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(0);
      });

      it("should return formatted application data with all required fields", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());

        const mockApplication = {
          id: 1,
          student_id: 1,
          job_post_id: 1,
          application_status_id: 1,
          applied_at: new Date("2025-01-15T10:00:00Z"),
          updated_at: new Date("2025-01-15T10:00:00Z"),
          applicationStatus: { id: 1, name: "Pending" },
          jobPost: {
            id: 1,
            jobName: "Software Engineer",
            location: "Bangkok",
            min_salary: 30000,
            max_salary: 50000,
            deadline: new Date("2025-02-01"),
            jobType: { id: 1, name: "Full-time" },
            jobArrangement: { id: 1, name: "On-site" },
            company: {
              id: 1,
              name: "Tech Corp",
              account: { logoUrl: "https://example.com/logo.png" }
            }
          },
          resumeDocument: {
            id: 1,
            file_name: "resume.pdf",
            file_path: "uploads/1/resume.pdf"
          },
          cvDocument: null,
          portfolioDocument: null,
          transcriptDocument: null,
        };

        (prisma.application.findMany as jest.Mock).mockResolvedValue([mockApplication]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({
          id: 1,
          status: "Pending",
          applied_at: expect.any(String),
          updated_at: expect.any(String),
          job: {
            id: 1,
            jobName: "Software Engineer",
            location: "Bangkok",
            jobType: "Full-time",
            jobArrangement: "On-site",
            min_salary: 30000,
            max_salary: 50000,
            company: {
              id: 1,
              name: "Tech Corp",
              logoUrl: "https://example.com/logo.png"
            }
          },
          documents: {
            resume: {
              id: 1,
              file_name: "resume.pdf",
              file_path: "uploads/1/resume.pdf"
            },
            cv: null,
            portfolio: null,
            transcript: null
          }
        });
      });

      it("should return multiple applications in descending order by applied_at", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());

        const mockApplications = [
          {
            id: 2,
            applied_at: new Date("2025-01-20"),
            updated_at: new Date("2025-01-20"),
            applicationStatus: { name: "Accepted" },
            jobPost: {
              id: 2,
              jobName: "Data Scientist",
              location: "Chiang Mai",
              jobType: { name: "Full-time" },
              jobArrangement: { name: "Hybrid" },
              min_salary: 40000,
              max_salary: 60000,
              deadline: new Date("2025-02-15"),
              company: { id: 2, name: "Data Inc", account: { logoUrl: null } }
            },
            resumeDocument: null,
            cvDocument: null,
            portfolioDocument: null,
            transcriptDocument: null,
          },
          {
            id: 1,
            applied_at: new Date("2025-01-15"),
            updated_at: new Date("2025-01-15"),
            applicationStatus: { name: "Pending" },
            jobPost: {
              id: 1,
              jobName: "Software Engineer",
              location: "Bangkok",
              jobType: { name: "Full-time" },
              jobArrangement: { name: "On-site" },
              min_salary: 30000,
              max_salary: 50000,
              deadline: new Date("2025-02-01"),
              company: { id: 1, name: "Tech Corp", account: { logoUrl: "logo.png" } }
            },
            resumeDocument: null,
            cvDocument: null,
            portfolioDocument: null,
            transcriptDocument: null,
          },
        ];

        (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe(2); // More recent application first
        expect(data[1].id).toBe(1);
      });

      it("should handle applications with all document types", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());

        const mockApplication = {
          id: 1,
          applied_at: new Date("2025-01-15"),
          updated_at: new Date("2025-01-15"),
          applicationStatus: { name: "Pending" },
          jobPost: {
            id: 1,
            jobName: "Software Engineer",
            location: "Bangkok",
            jobType: { name: "Full-time" },
            jobArrangement: { name: "On-site" },
            min_salary: 30000,
            max_salary: 50000,
            deadline: new Date("2025-02-01"),
            company: { id: 1, name: "Tech Corp", account: { logoUrl: null } }
          },
          resumeDocument: { id: 1, file_name: "resume.pdf", file_path: "uploads/1/resume.pdf" },
          cvDocument: { id: 2, file_name: "cv.pdf", file_path: "uploads/1/cv.pdf" },
          portfolioDocument: { id: 3, file_name: "portfolio.pdf", file_path: "uploads/1/portfolio.pdf" },
          transcriptDocument: { id: 4, file_name: "transcript.pdf", file_path: "uploads/1/transcript.pdf" },
        };

        (prisma.application.findMany as jest.Mock).mockResolvedValue([mockApplication]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0].documents.resume).toBeTruthy();
        expect(data[0].documents.cv).toBeTruthy();
        expect(data[0].documents.portfolio).toBeTruthy();
        expect(data[0].documents.transcript).toBeTruthy();
      });

      it("should handle applications with no documents", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());

        const mockApplication = {
          id: 1,
          applied_at: new Date("2025-01-15"),
          updated_at: new Date("2025-01-15"),
          applicationStatus: { name: "Pending" },
          jobPost: {
            id: 1,
            jobName: "Software Engineer",
            location: "Bangkok",
            jobType: { name: "Full-time" },
            jobArrangement: { name: "On-site" },
            min_salary: 30000,
            max_salary: 50000,
            deadline: new Date("2025-02-01"),
            company: { id: 1, name: "Tech Corp", account: { logoUrl: null } }
          },
          resumeDocument: null,
          cvDocument: null,
          portfolioDocument: null,
          transcriptDocument: null,
        };

        (prisma.application.findMany as jest.Mock).mockResolvedValue([mockApplication]);

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0].documents.resume).toBeNull();
        expect(data[0].documents.cv).toBeNull();
        expect(data[0].documents.portfolio).toBeNull();
        expect(data[0].documents.transcript).toBeNull();
      });
    });

    // Group 4: Error Handling (ASVS V9.1.1)
    describe("Error Handling", () => {
      it("V9.1.1: should handle database errors gracefully without leaking details", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockRejectedValue(
          new Error("Database connection lost")
        );

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch applications");
        // Should NOT expose internal error details
        expect(data).not.toHaveProperty("stack");
        expect(data.error).not.toContain("Database connection");
      });

      it("should handle application query errors gracefully", async () => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
        (prisma.application.findMany as jest.Mock).mockRejectedValue(
          new Error("Query timeout")
        );

        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch applications");
        expect(data).not.toHaveProperty("stack");
      });
    });

    // Group 5: Performance Tests
    describe("Performance", () => {
      beforeEach(() => {
        (getApiSession as jest.Mock).mockResolvedValue(mockSession.student);
        (prisma.student.findUnique as jest.Mock).mockResolvedValue(createMockStudent());
      });

      it("should respond within acceptable time for empty applications", async () => {
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const startTime = Date.now();
        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(500); // 500ms threshold
      });

      it("should handle large number of applications efficiently", async () => {
        const mockApplicationTemplate = {
          applied_at: new Date("2025-01-15"),
          updated_at: new Date("2025-01-15"),
          applicationStatus: { name: "Pending" },
          jobPost: {
            jobName: "Software Engineer",
            location: "Bangkok",
            jobType: { name: "Full-time" },
            jobArrangement: { name: "On-site" },
            min_salary: 30000,
            max_salary: 50000,
            deadline: new Date("2025-02-01"),
            company: { id: 1, name: "Tech Corp", account: { logoUrl: null } }
          },
          resumeDocument: null,
          cvDocument: null,
          portfolioDocument: null,
          transcriptDocument: null,
        };

        // Create 50 applications
        const mockApplications = Array.from({ length: 50 }, (_, i) => ({
          ...mockApplicationTemplate,
          id: i + 1,
          jobPost: { ...mockApplicationTemplate.jobPost, id: i + 1 }
        }));

        (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

        const startTime = Date.now();
        const request = new NextRequest("http://localhost:3000/api/students/applications");
        const response = await GET(request);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(50);
        expect(responseTime).toBeLessThan(1000); // 1000ms threshold for large dataset
      });

      it("should handle concurrent requests correctly", async () => {
        (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

        const startTime = Date.now();

        // Simulate 5 concurrent requests
        const requests = Array(5).fill(null).map(() =>
          GET(new NextRequest("http://localhost:3000/api/students/applications"))
        );

        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / responses.length;

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Average response time should be reasonable
        expect(averageTime).toBeLessThan(600); // 600ms average threshold
      });
    });
  });
});
