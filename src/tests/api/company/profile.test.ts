/**
 * Tests for Company Profile API
 * GET /api/company/profile - Fetch company profile
 * PATCH /api/company/profile - Update company profile
 */

import { GET, PATCH } from "@/app/api/company/profile/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";

// Mock modules
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
  NextRequest: class {
    url: string;
    method: string;
    body: any;

    constructor(url: string, init?: any) {
      this.url = url || "http://localhost";
      this.method = init?.method || "GET";
      this.body = init?.body;
    }

    async formData() {
      return this.body;
    }
  },
}));

// Silence console logs
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("GET /api/company/profile", () => {
  const mockAccount = {
    id: 1,
    email: "company@example.com",
    logoUrl: "https://example.com/logo.png",
    backgroundUrl: "https://example.com/bg.png",
    accountRole: { name: "company" },
  };

  const mockCompany = {
    id: 1,
    account_id: 1,
    name: "Tech Corp",
    address: "123 Tech Street",
    description: "A tech company",
    phone: "1234567890",
    registration_status: "APPROVED",
    verification_notes: null,
    account: {
      documents: [
        {
          id: 1,
          file_name: "company_evidence.pdf",
          file_path: "https://example.com/doc.pdf",
          created_at: new Date("2024-01-01"),
          documentType: { name: "Company Evidence" },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  describe("Profile Retrieval", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    });

    it("returns company profile successfully", async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.name).toBe("Tech Corp");
      expect(data.email).toBe("company@example.com");
    });

    it("includes profile images", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data.profile_url).toBe("https://example.com/logo.png");
      expect(data.bg_profile_url).toBe("https://example.com/bg.png");
    });

    it("includes company documents", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data.documents.evidence).toHaveLength(1);
      expect(data.documents.evidence[0].name).toBe("company_evidence.pdf");
    });

    it("includes registration status", async () => {
      const res = await GET();
      const data = await res.json();

      expect(data.registration_status).toBe("APPROVED");
    });
  });

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
  });
});

describe("PATCH /api/company/profile", () => {
  const mockAccount = {
    id: 1,
    email: "company@example.com",
    logoUrl: null,
    backgroundUrl: null,
    company: { id: 1, name: "Old Name" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

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

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    });

    it("validates company name length", async () => {
      const formData = new FormData();
      formData.append("name", "AB"); // Too short

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 3 characters");
    });

    it("validates phone number format", async () => {
      const formData = new FormData();
      formData.append("phone", "123"); // Too short

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 10 digits");
    });

    it("validates description length", async () => {
      const formData = new FormData();
      formData.append("description", "Short"); // Too short

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 10 characters");
    });
  });

  describe("Profile Update", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (prisma.company.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: "New Company Name",
        address: "New Address",
        phone: "1234567890",
        description: "New Description",
        website: "https://example.com",
      });
    });

    it("updates company profile successfully", async () => {
      const formData = new FormData();
      formData.append("name", "New Company Name");
      formData.append("address", "New Address");
      formData.append("phone", "1234567890");
      formData.append("description", "New Description for the company");
      formData.append("website", "https://example.com");

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe("Profile updated successfully");
      expect(prisma.company.update).toHaveBeenCalled();
    });

    it("updates only provided fields", async () => {
      const formData = new FormData();
      formData.append("name", "Just New Name");

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      await PATCH(req);

      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Just New Name",
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "company@example.com" },
      });
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    });

    it("handles database errors gracefully", async () => {
      (prisma.company.update as jest.Mock).mockRejectedValue(
        new Error("DB update failed")
      );

      const formData = new FormData();
      formData.append("name", "New Name");

      const req = new (require("next/server").NextRequest)(
        "http://localhost/api/company/profile",
        { method: "PATCH", body: formData }
      );

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update company profile");
    });
  });
});
