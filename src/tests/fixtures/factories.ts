/**
 * Test Factories - Mock Data Generators
 *
 * Factory functions for creating variations of mock data.
 * Use these instead of duplicating mock data in test files.
 */

import * as models from "./models";

// ============================================================================
// ACCOUNT FACTORIES
// ============================================================================

export function createMockAccount(overrides: any = {}) {
  return {
    ...models.mockStudentAccount,
    ...overrides,
  };
}

export function createMockStudentAccount(overrides: any = {}) {
  return {
    ...models.mockStudentAccount,
    ...overrides,
  };
}

export function createMockCompanyAccount(overrides: any = {}) {
  return {
    ...models.mockCompanyAccount,
    ...overrides,
  };
}

export function createMockAdminAccount(overrides: any = {}) {
  return {
    ...models.mockAdminAccount,
    ...overrides,
  };
}

// ============================================================================
// STUDENT FACTORIES
// ============================================================================

export function createMockStudent(overrides: any = {}) {
  const base = { ...models.mockStudent };

  // Deep merge account if provided in overrides
  if (overrides.account) {
    base.account = {
      ...base.account,
      ...overrides.account,
    };
  }

  return {
    ...base,
    ...overrides,
    // Preserve the merged account
    account: base.account,
  };
}

export function createMockPendingStudent(overrides: any = {}) {
  return {
    ...models.mockPendingStudent,
    ...overrides,
  };
}

export function createMockApprovedStudent(overrides: any = {}) {
  return {
    ...models.mockStudent,
    verification_status: "APPROVED",
    ...overrides,
  };
}

export function createMockRejectedStudent(overrides: any = {}) {
  return {
    ...models.mockRejectedStudent,
    ...overrides,
  };
}

// ============================================================================
// COMPANY FACTORIES
// ============================================================================

export function createMockCompany(overrides: any = {}) {
  return {
    ...models.mockCompany,
    ...overrides,
  };
}

export function createMockPendingCompany(overrides: any = {}) {
  return {
    ...models.mockPendingCompany,
    ...overrides,
  };
}

export function createMockApprovedCompany(overrides: any = {}) {
  return {
    ...models.mockCompany,
    registration_status: "APPROVED",
    ...overrides,
  };
}

export function createMockRejectedCompany(overrides: any = {}) {
  return {
    ...models.mockRejectedCompany,
    ...overrides,
  };
}

// ============================================================================
// JOB POST FACTORIES
// ============================================================================

export function createMockJobPost(overrides: any = {}) {
  return {
    ...models.mockJobPost,
    ...overrides,
  };
}

export function createMockDraftJobPost(overrides: any = {}) {
  return {
    ...models.mockDraftJobPost,
    ...overrides,
  };
}

export function createMockExpiredJobPost(overrides: any = {}) {
  return {
    ...models.mockExpiredJobPost,
    ...overrides,
  };
}

export function createMockPublishedJobPost(overrides: any = {}) {
  return {
    ...models.mockJobPost,
    is_Published: true,
    deadline: new Date("2026-12-31"), // Future date
    ...overrides,
  };
}

// ============================================================================
// APPLICATION FACTORIES
// ============================================================================

export function createMockApplication(overrides: any = {}) {
  return {
    ...models.mockApplication,
    ...overrides,
  };
}

export function createMockPendingApplication(overrides: any = {}) {
  return {
    ...models.mockApplication,
    status: 1,
    applicationStatus: { id: 1, name: "pending" },
    ...overrides,
  };
}

export function createMockAcceptedApplication(overrides: any = {}) {
  return {
    ...models.mockAcceptedApplication,
    ...overrides,
  };
}

export function createMockRejectedApplication(overrides: any = {}) {
  return {
    ...models.mockRejectedApplication,
    ...overrides,
  };
}

// ============================================================================
// DOCUMENT FACTORIES
// ============================================================================

export function createMockDocument(overrides: any = {}) {
  return {
    ...models.mockDocument,
    ...overrides,
  };
}

export function createMockStudentIDDocument(overrides: any = {}) {
  return {
    ...models.mockDocument,
    doc_type_id: 1,
    file_name: "student_id.pdf",
    documentType: { id: 1, name: "Student ID Card" },
    ...overrides,
  };
}

export function createMockTranscriptDocument(overrides: any = {}) {
  return {
    ...models.mockTranscriptDocument,
    ...overrides,
  };
}

export function createMockCompanyEvidenceDocument(overrides: any = {}) {
  return {
    ...models.mockCompanyEvidenceDocument,
    ...overrides,
  };
}

// ============================================================================
// NOTIFICATION FACTORIES
// ============================================================================

export function createMockNotification(overrides: any = {}) {
  return {
    ...models.mockNotification,
    ...overrides,
  };
}

export function createMockUnreadNotification(overrides: any = {}) {
  return {
    ...models.mockNotification,
    is_read: false,
    ...overrides,
  };
}

export function createMockReadNotification(overrides: any = {}) {
  return {
    ...models.mockReadNotification,
    ...overrides,
  };
}

// ============================================================================
// EMAIL VERIFICATION FACTORIES
// ============================================================================

export function createMockEmailVerificationToken(overrides: any = {}) {
  return {
    ...models.mockEmailVerificationToken,
    ...overrides,
  };
}

export function createMockValidEmailToken(overrides: any = {}) {
  return {
    ...models.mockEmailVerificationToken,
    expires_at: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes
    ...overrides,
  };
}

export function createMockExpiredEmailToken(overrides: any = {}) {
  return {
    ...models.mockExpiredEmailVerificationToken,
    ...overrides,
  };
}

// ============================================================================
// SAVED JOB FACTORIES
// ============================================================================

export function createMockSavedJob(overrides: any = {}) {
  return {
    ...models.mockSavedJob,
    ...overrides,
  };
}

// ============================================================================
// BATCH FACTORIES (for lists/arrays)
// ============================================================================

export function createMockStudents(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockStudent({
      id: i + 1,
      account_id: i + 10,
      name: `Student ${i + 1}`,
      student_id: `b65${String(i + 1).padStart(5, "0")}`,
      account: {
        ...models.mockStudentAccount,
        id: i + 10,
        email: `student${i + 1}@ku.th`,
      },
      ...baseOverrides,
    })
  );
}

export function createMockCompanies(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockCompany({
      id: i + 1,
      account_id: i + 20,
      name: `Company ${i + 1}`,
      account: {
        ...models.mockCompanyAccount,
        id: i + 20,
        email: `company${i + 1}@example.com`,
      },
      ...baseOverrides,
    })
  );
}

export function createMockJobPosts(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockJobPost({
      id: i + 1,
      jobName: `Job Position ${i + 1}`,
      ...baseOverrides,
    })
  );
}

export function createMockApplications(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockApplication({
      id: i + 1,
      student_id: baseOverrides.student_id || i + 1,
      job_post_id: baseOverrides.job_post_id || i + 1,
      ...baseOverrides,
    })
  );
}

export function createMockDocuments(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockDocument({
      id: i + 1,
      file_name: `document_${i + 1}.pdf`,
      ...baseOverrides,
    })
  );
}

export function createMockNotifications(count: number, baseOverrides: any = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockNotification({
      id: i + 1,
      message: `Notification ${i + 1}`,
      ...baseOverrides,
    })
  );
}
