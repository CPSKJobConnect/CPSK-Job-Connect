import { GET } from "@/app/api/company/applicants/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn((path) => ({
          data: { signedUrl: `https://example.com/signed/${path}` },
        })),
      })),
    },
  })),
}));

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/company/applicants/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please login.");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: {} });

      const request = new NextRequest("http://localhost:3000/api/company/applicants/1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please login.");
    });

    it("should return 403 if company not found", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "user@example.com" },
      });
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("No company found for this account.");
    });
  });

  describe("Fetching applicant details", () => {
    const mockSession = {
      user: { id: "1", email: "company@example.com" },
    };

    const mockCompany = {
      id: 10,
    };

    const mockApplication = {
      id: 5,
      applied_at: new Date("2024-01-01"),
      student: {
        id: 20,
        name: "John Doe Smith",
        student_id: "S001",
        phone: "1234567890",
        faculty: "Engineering",
        year: "3",
        account: {
          email: "student@example.com",
          logoUrl: "http://example.com/profile.png",
        },
      },
      jobPost: {
        id: 1,
        jobName: "Software Engineer",
        company_id: 10,
      },
      resumeDocument: {
        id: 1,
        file_path: "resume.pdf",
        file_name: "resume.pdf",
      },
      cvDocument: null,
      portfolioDocument: null,
      transcriptDocument: null,
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    });

    it("should return applicant details successfully", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.applicant_id).toBe("20");
    });

    it("should return 400 for invalid application ID", async () => {
      const request = new NextRequest("http://localhost:3000/api/company/applicants/invalid");
      const response = await GET(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid application ID.");
    });

    it("should return 404 if application not found", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Application not found.");
    });

    it("should return 403 if application does not belong to company", async () => {
      const otherCompanyApplication = {
        ...mockApplication,
        jobPost: {
          ...mockApplication.jobPost,
          company_id: 999, // Different company
        },
      };
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(otherCompanyApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You do not have permission to view this applicant.");
    });

    it("should split name into firstname and lastname", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.firstname).toBe("John");
      expect(data.data.lastname).toBe("Doe Smith");
    });

    it("should include student information", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      const applicant = data.data;
      expect(applicant.email).toBe("student@example.com");
      expect(applicant.phone_number).toBe("1234567890");
      expect(applicant.faculty).toBe("Engineering");
      expect(applicant.year).toBe("3");
      expect(applicant.student_id).toBe("S001");
    });

    it("should include job information", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.applied_position).toBe("Software Engineer");
      expect(data.data.applied_at).toBeDefined();
    });

    it("should include resume document URL when available", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.documents.resume_id).toBe(1);
      expect(data.data.documents.resume_url).toBe("https://example.com/signed/resume.pdf");
      expect(data.data.documents.resume_name).toBe("resume.pdf");
    });

    it("should handle null resume document", async () => {
      const applicationWithoutResume = {
        ...mockApplication,
        resumeDocument: null,
      };
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(applicationWithoutResume);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.documents.resume_id).toBeNull();
      expect(data.data.documents.resume_url).toBeNull();
      expect(data.data.documents.resume_name).toBeNull();
    });

    it("should include all document types", async () => {
      const fullApplication = {
        ...mockApplication,
        cvDocument: { id: 2, file_path: "cv.pdf", file_name: "cv.pdf" },
        portfolioDocument: { id: 3, file_path: "portfolio.pdf", file_name: "portfolio.pdf" },
        transcriptDocument: { id: 4, file_path: "transcript.pdf", file_name: "transcript.pdf" },
      };
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(fullApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      const docs = data.data.documents;
      expect(docs.cv_id).toBe(2);
      expect(docs.portfolio_id).toBe(3);
      expect(docs.transcript_id).toBe(4);
    });

    it("should use default avatar when logoUrl is null", async () => {
      const appWithoutLogo = {
        ...mockApplication,
        student: {
          ...mockApplication.student,
          account: {
            ...mockApplication.student.account,
            logoUrl: null,
          },
        },
      };
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(appWithoutLogo);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.profile_url).toBe("/default-avatar.png");
    });

    it("should include work experience and certifications as empty arrays", async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(data.data.work_experience).toEqual([]);
      expect(data.data.certification).toEqual([]);
    });

    it("should handle database errors", async () => {
      (prisma.application.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/company/applicants/5");
      const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
