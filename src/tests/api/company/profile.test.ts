/**
 * Tests for Company Profile API
 *
 * Endpoints:
 * - GET /api/company/profile - Fetch company profile
 * - PATCH /api/company/profile - Update company profile
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Validation, Sanitization and Encoding
 * - V7: Error Handling and Logging
 */

import { GET, PATCH } from "@/app/api/company/profile/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";

// Import fixtures
import {
  mockCompany,
  mockCompanyAccount,
  mockCompanyEvidenceDocument,
  createMockCompany,
  createMockCompanyAccount,
} from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/uploadImage", () => ({
  uploadImage: jest.fn(),
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

// Silence console logs
silenceConsole();

// ============================================================================
// GET /api/company/profile
// ============================================================================

describe("GET /api/company/profile", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 if account not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Account not found");
    });

    it("returns 404 if company not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockCompanyAccount);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  // ==========================================================================
  // BUSINESS LOGIC TESTS
  // ==========================================================================

  describe("Profile Retrieval", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockCompanyAccount);
    });

    it("returns company profile successfully", async () => {
      const companyWithDocuments = {
        ...mockCompany,
        account: {
          ...mockCompanyAccount,
          documents: [mockCompanyEvidenceDocument],
        },
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(companyWithDocuments);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(mockCompany.id);
      expect(data.name).toBe(mockCompany.name);
      expect(data.email).toBe(mockCompanyAccount.email);
    });

    it("includes profile images", async () => {
      const companyWithDocuments = {
        ...mockCompany,
        account: {
          ...mockCompanyAccount,
          documents: [],
        },
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(companyWithDocuments);

      const res = await GET();
      const data = await res.json();

      expect(data.profile_url).toBe(mockCompanyAccount.logoUrl);
      expect(data.bg_profile_url).toBe(mockCompanyAccount.backgroundUrl);
    });

    it("includes company documents", async () => {
      const companyWithDocuments = {
        ...mockCompany,
        account: {
          ...mockCompanyAccount,
          documents: [mockCompanyEvidenceDocument],
        },
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(companyWithDocuments);

      const res = await GET();
      const data = await res.json();

      expect(data.documents.evidence).toHaveLength(1);
      expect(data.documents.evidence[0].name).toBe(mockCompanyEvidenceDocument.file_name);
    });

    it("includes registration status", async () => {
      const companyWithDocuments = {
        ...mockCompany,
        account: {
          ...mockCompanyAccount,
          documents: [],
        },
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(companyWithDocuments);

      const res = await GET();
      const data = await res.json();

      expect(data.registration_status).toBe(mockCompany.registration_status);
    });

    it("handles empty documents array", async () => {
      const companyWithNoDocuments = {
        ...mockCompany,
        account: {
          ...mockCompanyAccount,
          documents: [],
        },
      };

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(companyWithNoDocuments);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.documents.evidence).toHaveLength(0);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
    });

    it("handles database errors gracefully", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch company profile");
    });

    it("handles unexpected errors", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      const res = await GET();

      expect(res.status).toBe(500);
    });
  });
});

// ============================================================================
// PATCH /api/company/profile
// ============================================================================

describe("PATCH /api/company/profile", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 if company not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        company: null,
      });

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("Input Validation", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockCompanyAccount,
        company: mockCompany,
      });
    });

    it("validates company name length", async () => {
      const formData = new FormData();
      formData.append("name", "AB"); // Too short

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 3 characters");
    });

    it("validates phone number format", async () => {
      const formData = new FormData();
      formData.append("phone", "123"); // Too short

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 10 digits");
    });

    it("validates description length", async () => {
      const formData = new FormData();
      formData.append("description", "Short"); // Too short

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 10 characters");
    });

    it("accepts valid input data", async () => {
      (prisma.company.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        name: "Valid Company Name",
      });

      const formData = new FormData();
      formData.append("name", "Valid Company Name");
      formData.append("phone", "0212345678");
      formData.append("description", "A valid company description with sufficient length");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // BUSINESS LOGIC TESTS
  // ==========================================================================

  describe("Profile Update", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockCompanyAccount,
        company: mockCompany,
      });
    });

    it("updates company profile successfully", async () => {
      const updatedCompany = {
        ...mockCompany,
        name: "New Company Name",
        address: "New Address",
        phone: "1234567890",
        description: "New Description for the company",
        website: "https://example.com",
      };

      (prisma.company.update as jest.Mock).mockResolvedValue(updatedCompany);

      const formData = new FormData();
      formData.append("name", "New Company Name");
      formData.append("address", "New Address");
      formData.append("phone", "1234567890");
      formData.append("description", "New Description for the company");
      formData.append("website", "https://example.com");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe("Profile updated successfully");
      expect(prisma.company.update).toHaveBeenCalled();
    });

    it("updates only provided fields", async () => {
      (prisma.company.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        name: "Just New Name",
      });

      const formData = new FormData();
      formData.append("name", "Just New Name");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      await PATCH(req);

      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Just New Name",
          }),
        })
      );
    });

    it("handles partial updates correctly", async () => {
      (prisma.company.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        description: "Updated description only",
      });

      const formData = new FormData();
      formData.append("description", "Updated description only");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);

      expect(res.status).toBe(200);
      expect(prisma.company.update).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockCompanyAccount,
        company: mockCompany,
      });
    });

    it("handles database errors gracefully", async () => {
      (prisma.company.update as jest.Mock).mockRejectedValue(
        new Error("DB update failed")
      );

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update company profile");
    });

    it("handles unexpected errors", async () => {
      (prisma.company.update as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new NextRequest("http://localhost/api/company/profile", {
        method: "PATCH",
        body: formData as any,
      });

      const res = await PATCH(req);

      expect(res.status).toBe(500);
    });
  });
});
