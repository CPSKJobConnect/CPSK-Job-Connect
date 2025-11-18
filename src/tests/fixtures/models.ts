/**
 * Test Fixtures - Mock Data Models
 *
 * Centralized mock data for all tests.
 * Use factories.ts for creating variations of these models.
 */

// ============================================================================
// ACCOUNTS
// ============================================================================

export const mockStudentAccount = {
  id: 1,
  email: "student@ku.th",
  password: "hashedPassword123",
  logoUrl: "https://example.com/student-logo.png",
  backgroundUrl: "https://example.com/student-bg.png",
  role: 1,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  accountRole: {
    id: 1,
    name: "student",
  },
  documents: [],
};

export const mockCompanyAccount = {
  id: 2,
  email: "company@example.com",
  password: "hashedPassword456",
  logoUrl: "https://example.com/company-logo.png",
  backgroundUrl: "https://example.com/company-bg.png",
  role: 2,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  accountRole: {
    id: 2,
    name: "company",
  },
  documents: [],
};

export const mockAdminAccount = {
  id: 3,
  email: "admin@ku.th",
  password: "hashedPassword789",
  logoUrl: null,
  backgroundUrl: null,
  role: 3,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  accountRole: {
    id: 3,
    name: "admin",
  },
};

// ============================================================================
// STUDENTS
// ============================================================================

export const mockStudent = {
  id: 1,
  account_id: 1,
  name: "John Doe",
  student_id: "b6410000000",
  major: "Computer Science",
  faculty: "Software and Knowledge Engineering (SKE)",
  year: "2",
  gpa: 3.75,
  phone: "0812345678",
  student_status: "CURRENT",
  verification_status: "APPROVED",
  verification_notes: null,
  email_verified: true,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  account: mockStudentAccount,
};

export const mockPendingStudent = {
  ...mockStudent,
  id: 2,
  account_id: 4,
  name: "Jane Smith",
  student_id: "b6410000001",
  verification_status: "PENDING",
  account: {
    ...mockStudentAccount,
    id: 4,
    email: "jane@ku.th",
  },
};

export const mockRejectedStudent = {
  ...mockStudent,
  id: 3,
  account_id: 5,
  name: "Bob Johnson",
  student_id: "b6410000002",
  verification_status: "REJECTED",
  verification_notes: "Invalid student ID",
  account: {
    ...mockStudentAccount,
    id: 5,
    email: "bob@ku.th",
  },
};

// ============================================================================
// COMPANIES
// ============================================================================

export const mockCompany = {
  id: 1,
  account_id: 2,
  name: "Tech Corp",
  address: "123 Tech Street, Bangkok",
  description: "Leading technology company in Thailand",
  phone: "0212345678",
  website: "https://techcorp.example.com",
  registration_status: "APPROVED",
  verification_notes: null,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  account: mockCompanyAccount,
};

export const mockPendingCompany = {
  ...mockCompany,
  id: 2,
  account_id: 6,
  name: "StartUp Inc",
  registration_status: "PENDING",
  account: {
    ...mockCompanyAccount,
    id: 6,
    email: "startup@example.com",
  },
};

export const mockRejectedCompany = {
  ...mockCompany,
  id: 3,
  account_id: 7,
  name: "Fake Company",
  registration_status: "REJECTED",
  verification_notes: "Invalid business registration",
  account: {
    ...mockCompanyAccount,
    id: 7,
    email: "fake@example.com",
  },
};

// ============================================================================
// JOB POSTS
// ============================================================================

export const mockJobCategory = {
  id: 1,
  name: "Software Development",
};

export const mockJobType = {
  id: 1,
  name: "Full-time",
};

export const mockJobArrangement = {
  id: 1,
  name: "On-site",
};

export const mockJobPost = {
  id: 1,
  company_id: 1,
  jobName: "Senior Software Engineer",
  location: "Bangkok",
  category_id: 1,
  min_salary: 50000,
  max_salary: 80000,
  job_type_id: 1,
  job_arrangement_id: 1,
  aboutRole: "We are looking for a senior software engineer to join our team.",
  responsibilities: "Develop and maintain software applications",
  requirements: ["3+ years of experience", "Strong programming skills"],
  qualifications: ["Bachelor's degree in Computer Science", "Experience with TypeScript"],
  deadline: new Date("2026-12-31"),
  is_Published: true,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
  company: mockCompany,
  category: mockJobCategory,
  jobType: mockJobType,
  jobArrangement: mockJobArrangement,
  tags: [
    { id: 1, name: "TypeScript", job_post_id: 1 },
    { id: 2, name: "React", job_post_id: 1 },
  ],
  applications: [],
};

export const mockDraftJobPost = {
  ...mockJobPost,
  id: 2,
  jobName: "Junior Developer",
  is_Published: false,
};

export const mockExpiredJobPost = {
  ...mockJobPost,
  id: 3,
  jobName: "Marketing Manager",
  deadline: new Date("2023-01-01"), // Expired
};

// ============================================================================
// APPLICATIONS
// ============================================================================

export const mockApplicationStatus = {
  id: 1,
  name: "pending",
};

export const mockApplication = {
  id: 1,
  student_id: 1,
  job_post_id: 1,
  status: 1,
  resume: "https://example.com/resume.pdf",
  cover_letter: "I am excited to apply for this position...",
  created_at: new Date("2024-02-01"),
  updated_at: new Date("2024-02-01"),
  student: mockStudent,
  jobPost: mockJobPost,
  applicationStatus: mockApplicationStatus,
};

export const mockAcceptedApplication = {
  ...mockApplication,
  id: 2,
  status: 2,
  applicationStatus: {
    id: 2,
    name: "accepted",
  },
};

export const mockRejectedApplication = {
  ...mockApplication,
  id: 3,
  status: 3,
  applicationStatus: {
    id: 3,
    name: "rejected",
  },
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export const mockDocumentType = {
  id: 1,
  name: "Student ID Card",
};

export const mockDocument = {
  id: 1,
  account_id: 1,
  doc_type_id: 1,
  file_name: "student_id.pdf",
  file_path: "https://example.com/documents/student_id.pdf",
  created_at: new Date("2024-01-01"),
  documentType: mockDocumentType,
};

export const mockTranscriptDocument = {
  ...mockDocument,
  id: 2,
  doc_type_id: 2,
  file_name: "transcript.pdf",
  file_path: "https://example.com/documents/transcript.pdf",
  documentType: {
    id: 2,
    name: "Transcript",
  },
};

export const mockCompanyEvidenceDocument = {
  ...mockDocument,
  id: 3,
  account_id: 2,
  doc_type_id: 7,
  file_name: "company_evidence.pdf",
  file_path: "https://example.com/documents/company_evidence.pdf",
  documentType: {
    id: 7,
    name: "Company Evidence",
  },
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const mockNotification = {
  id: 1,
  account_id: 1,
  sender_id: 2,
  message: "Your application has been reviewed",
  is_read: false,
  created_at: new Date("2024-02-15"),
};

export const mockReadNotification = {
  ...mockNotification,
  id: 2,
  is_read: true,
};

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export const mockEmailVerificationToken = {
  id: 1,
  email: "student@ku.th",
  token: "123456",
  expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
  created_at: new Date(),
};

export const mockExpiredEmailVerificationToken = {
  ...mockEmailVerificationToken,
  id: 2,
  token: "654321",
  expires_at: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago (expired)
};

// ============================================================================
// SAVED JOBS
// ============================================================================

export const mockSavedJob = {
  id: 1,
  student_id: 1,
  job_post_id: 1,
  created_at: new Date("2024-02-01"),
  jobPost: mockJobPost,
};
