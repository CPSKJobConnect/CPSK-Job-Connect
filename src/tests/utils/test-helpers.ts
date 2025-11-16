/**
 * Test Utilities and Helpers
 *
 * Provides reusable functions for API testing including:
 * - JWT token generation
 * - Mock session creation
 * - Request builders
 */

import { sign } from "jsonwebtoken";

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(
  userId: string = "1",
  email: string = "test@ku.th",
  role: string = "student",
  expiresIn: string = "1h"
): string {
  const secret = process.env.NEXTAUTH_SECRET || "test-secret";

  return sign(
    {
      sub: userId,
      email,
      name: "Test User",
      role,
      username: "Test User"
    },
    secret,
    { expiresIn }
  );
}

/**
 * Generate an expired token for testing
 */
export function generateExpiredToken(
  email: string = "test@ku.th",
  role: string = "student"
): string {
  const secret = process.env.NEXTAUTH_SECRET || "test-secret";

  return sign(
    {
      sub: "1",
      email,
      name: "Test User",
      role,
      username: "Test User"
    },
    secret,
    { expiresIn: "-1h" } // Already expired
  );
}

/**
 * Mock session objects for different user roles
 */
export const mockSession = {
  student: {
    user: {
      id: "1",
      email: "student@ku.th",
      role: "student",
      name: "Test Student",
      username: "Test Student"
    },
    expires: ""
  },
  studentB: {
    user: {
      id: "2",
      email: "studentB@ku.th",
      role: "student",
      name: "Student B",
      username: "Student B"
    },
    expires: ""
  },
  company: {
    user: {
      id: "3",
      email: "company@test.com",
      role: "company",
      name: "Test Company",
      username: "Test Company"
    },
    expires: ""
  },
  admin: {
    user: {
      id: "4",
      email: "admin@cpsk.com",
      role: "admin",
      name: "Admin User",
      username: "Admin User"
    },
    expires: ""
  }
};

/**
 * Create mock student data
 */
export function createMockStudent(overrides: any = {}) {
  return {
    id: 1,
    account_id: 1,
    name: "John Doe",
    student_id: "b6410000000",
    faculty: "Software and Knowledge Engineering (SKE)",
    year: "2",
    phone: "0812345678",
    student_status: "CURRENT",
    verification_status: "APPROVED",
    email_verified: true,
    account: {
      id: 1,
      email: "student@ku.th",
      logoUrl: null,
      backgroundUrl: null,
      documents: []
    },
    ...overrides
  };
}

/**
 * Create mock document data
 */
export function createMockDocument(docTypeId: number = 1, overrides: any = {}) {
  return {
    id: 1,
    account_id: 1,
    doc_type_id: docTypeId,
    file_path: `uploads/1/document-${docTypeId}.pdf`,
    file_name: `document-${docTypeId}.pdf`,
    created_at: new Date("2025-01-01"),
    ...overrides
  };
}

/**
 * Create a mock NextRequest
 */
export function createMockRequest(
  url: string,
  options: RequestInit = {}
): Request {
  return new Request(url, options);
}

/**
 * Create a mock NextRequest with authentication header
 */
export function createAuthenticatedRequest(
  url: string,
  token?: string,
  options: RequestInit = {}
): Request {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new Request(url, {
    ...options,
    headers
  });
}

/**
 * Create a mock FormData for file upload tests
 */
export function createMockFormData(
  fileName: string = "test.pdf",
  fileContent: string = "test content",
  docTypeId: string = "1"
): FormData {
  const blob = new Blob([fileContent], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("docTypeId", docTypeId);

  return formData;
}

/**
 * Extract JSON from Response
 */
export async function getResponseJSON(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}
