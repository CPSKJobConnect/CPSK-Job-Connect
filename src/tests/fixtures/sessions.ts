/**
 * Test Session Fixtures
 *
 * Centralized session mocks for authentication testing.
 * All tests should use getApiSession from @/lib/api-auth.
 */

import { NextRequest } from "next/server";

// ============================================================================
// SESSION MOCKS
// ============================================================================

export const mockStudentSession = {
  user: {
    id: "1",
    email: "student@ku.th",
    role: "student",
    name: "John Doe",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export const mockCompanySession = {
  user: {
    id: "2",
    email: "company@example.com",
    role: "company",
    name: "Tech Corp",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    id: "3",
    email: "admin@ku.th",
    role: "admin",
    name: "Admin User",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// ============================================================================
// SESSION FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a mock session for any role
 */
export function createMockSession(role: "student" | "company" | "admin", overrides: any = {}) {
  const baseSessions = {
    student: mockStudentSession,
    company: mockCompanySession,
    admin: mockAdminSession,
  };

  return {
    ...baseSessions[role],
    ...overrides,
  };
}

/**
 * Create a mock student session
 */
export function createMockStudentSession(overrides: any = {}) {
  return {
    ...mockStudentSession,
    ...overrides,
  };
}

/**
 * Create a mock company session
 */
export function createMockCompanySession(overrides: any = {}) {
  return {
    ...mockCompanySession,
    ...overrides,
  };
}

/**
 * Create a mock admin session
 */
export function createMockAdminSession(overrides: any = {}) {
  return {
    ...mockAdminSession,
    ...overrides,
  };
}

/**
 * Create an expired session
 */
export function createMockExpiredSession(role: "student" | "company" | "admin" = "student") {
  return createMockSession(role, {
    expires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
  });
}

// ============================================================================
// REQUEST MOCKS WITH SESSIONS
// ============================================================================

/**
 * Create a mock NextRequest with session headers
 * Use this for testing routes that use getApiSession
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    session?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, session, headers = {} } = options;

  // Create the request
  const request = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  // If session is provided, we'll mock it in the test using getApiSession
  // This is just a helper to create the request object
  return request;
}

/**
 * Create a mock NextRequest with FormData body
 */
export function createMockRequestWithFormData(
  url: string,
  formData: FormData,
  options: {
    method?: string;
    session?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "POST", headers = {} } = options;

  const request = new NextRequest(url, {
    method,
    body: formData as any,
    headers: {
      ...headers,
    },
  });

  return request;
}

// ============================================================================
// MOCK HELPERS FOR getApiSession
// ============================================================================

/**
 * Mock getApiSession to return a specific session
 * Use this in your tests:
 *
 * import { getApiSession } from "@/lib/api-auth";
 * import { mockGetApiSession } from "@/tests/fixtures/sessions";
 *
 * jest.mock("@/lib/api-auth");
 *
 * beforeEach(() => {
 *   mockGetApiSession(getApiSession as jest.Mock, mockStudentSession);
 * });
 */
export function mockGetApiSession(mockFn: jest.Mock, session: any = mockStudentSession) {
  mockFn.mockResolvedValue(session);
}

/**
 * Mock getApiSession to return null (unauthenticated)
 */
export function mockUnauthenticatedSession(mockFn: jest.Mock) {
  mockFn.mockResolvedValue(null);
}

/**
 * Mock getApiSession to throw an error
 */
export function mockSessionError(mockFn: jest.Mock, error: Error = new Error("Session error")) {
  mockFn.mockRejectedValue(error);
}
