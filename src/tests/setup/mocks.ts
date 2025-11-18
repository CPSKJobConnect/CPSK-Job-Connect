/**
 * Standard Mock Setup
 *
 * Common mocks used across all test files.
 * Import and use these instead of manually creating mocks in each file.
 */

// ============================================================================
// PRISMA MOCK SETUP
// ============================================================================

/**
 * Standard Prisma mock structure
 * Use this in your test files:
 *
 * jest.mock("@/lib/db", () => ({
 *   prisma: createPrismaMock()
 * }));
 */
export function createPrismaMock() {
  return {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    jobPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    applicationStatus: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    documentType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    email_verification_tokens: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    savedJob: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    jobCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    jobType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    jobArrangement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    report: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}

// ============================================================================
// NEXT-AUTH MOCK SETUP
// ============================================================================

/**
 * Mock for getApiSession (recommended for all new tests)
 */
export const mockGetApiSession = jest.fn();

/**
 * Mock for getServerSession (legacy - use getApiSession instead)
 */
export const mockGetServerSession = jest.fn();

// ============================================================================
// NEXT.JS RESPONSE MOCK
// ============================================================================

/**
 * Standard NextResponse mock
 * Returns a response object with status, body, and json() method
 */
export const mockNextResponse = {
  json: (body: any, opts?: { status?: number }) => ({
    status: opts?.status || 200,
    body,
    json: async () => body,
  }),
};

// ============================================================================
// FILE UPLOAD MOCKS
// ============================================================================

/**
 * Mock for uploadImage
 */
export const mockUploadImage = jest.fn();

/**
 * Mock for uploadDocument
 */
export const mockUploadDocument = jest.fn();

// ============================================================================
// EMAIL MOCKS
// ============================================================================

/**
 * Mock for sendEmail
 */
export const mockSendEmail = jest.fn();

/**
 * Mock for sendAlumniStatusEmail
 */
export const mockSendAlumniStatusEmail = jest.fn();

/**
 * Mock for sendVerificationEmail
 */
export const mockSendVerificationEmail = jest.fn();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Reset all mocks - call this in beforeEach
 */
export function resetAllMocks() {
  jest.clearAllMocks();
}

/**
 * Silence console output in tests
 */
export function silenceConsole() {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
}

/**
 * Restore console output
 */
export function restoreConsole() {
  jest.restoreAllMocks();
}
