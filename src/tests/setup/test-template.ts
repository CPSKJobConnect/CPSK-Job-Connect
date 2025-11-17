/**
 * TEST TEMPLATE - Copy this file when creating new tests
 *
 * File: src/tests/api/[domain]/[endpoint].test.ts
 * Tests: [HTTP_METHOD] /api/[domain]/[endpoint]
 *
 * ASVS Coverage:
 * - V1: Architecture, Design and Threat Modeling
 * - V2: Authentication
 * - V3: Session Management
 * - V4: Access Control
 * - V5: Validation, Sanitization and Encoding
 * - V7: Error Handling and Logging
 */

import { GET, POST, PUT, PATCH, DELETE } from "@/app/api/[domain]/[endpoint]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Import fixtures
import {
  mockStudent,
  mockCompany,
  mockStudentSession,
  mockCompanySession,
  mockAdminSession,
  createMockStudent,
  createMockRequest,
  mockGetApiSession as mockSession,
  mockUnauthenticatedSession,
} from "@/tests/fixtures";

// Import mocks
import { createPrismaMock, silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: createPrismaMock(),
}));

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
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

// Silence console logs during tests
silenceConsole();

// ============================================================================
// TESTS
// ============================================================================

describe("GET /api/[domain]/[endpoint]", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe("Authentication", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockUnauthenticatedSession(getApiSession as jest.Mock);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session is invalid", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ========================================================================
  // AUTHORIZATION TESTS
  // ========================================================================

  describe("Authorization", () => {
    it("returns 403 if user lacks required role", async () => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
      // Test expects admin role but student is provided

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Forbidden");
    });

    it("allows access for authorized role", async () => {
      mockSession(getApiSession as jest.Mock, mockAdminSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        email: "admin@ku.th",
        accountRole: { name: "admin" },
      });

      const res = await GET();

      expect(res.status).not.toBe(403);
    });
  });

  // ========================================================================
  // INPUT VALIDATION TESTS
  // ========================================================================

  describe("Input Validation", () => {
    beforeEach(() => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
    });

    it("validates required fields are present", async () => {
      // Test with missing required fields
      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {}, // Missing required fields
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("validates field formats", async () => {
      // Test with invalid field formats
      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {
          email: "invalid-email", // Invalid format
        },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("invalid");
    });

    it("validates field lengths", async () => {
      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {
          name: "AB", // Too short
        },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least");
    });
  });

  // ========================================================================
  // BUSINESS LOGIC TESTS
  // ========================================================================

  describe("Business Logic", () => {
    beforeEach(() => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
    });

    it("successfully retrieves data", async () => {
      const mockData = mockStudent;
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockData);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({
        id: mockData.id,
        name: mockData.name,
      });
    });

    it("returns 404 when resource not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("handles empty result sets", async () => {
      (prisma.student.findMany as jest.Mock).mockResolvedValue([]);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
    });

    it("handles database errors gracefully", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("handles unexpected errors", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      const res = await GET();

      expect(res.status).toBe(500);
    });

    it("logs errors appropriately", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error");
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(
        new Error("Test error")
      );

      await GET();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // PERFORMANCE TESTS (Optional)
  // ========================================================================

  describe("Performance", () => {
    beforeEach(() => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
    });

    it("completes request within acceptable time", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const startTime = Date.now();
      await GET();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });
  });
});

// ============================================================================
// POST/PUT/PATCH/DELETE TESTS (Add as needed)
// ============================================================================

describe("POST /api/[domain]/[endpoint]", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      mockUnauthenticatedSession(getApiSession as jest.Mock);

      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {},
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Data Creation", () => {
    beforeEach(() => {
      mockSession(getApiSession as jest.Mock, mockStudentSession);
    });

    it("successfully creates resource", async () => {
      const newData = createMockStudent({ id: 999 });
      (prisma.student.create as jest.Mock).mockResolvedValue(newData);

      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {
          name: newData.name,
          student_id: newData.student_id,
        },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe(999);
    });

    it("prevents duplicate creation", async () => {
      (prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);

      const req = createMockRequest("http://localhost/api/endpoint", {
        method: "POST",
        body: {
          student_id: mockStudent.student_id, // Duplicate
        },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toContain("already exists");
    });
  });
});
