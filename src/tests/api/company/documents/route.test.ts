import { POST } from "@/app/api/company/documents/route";
import { prisma } from "@/lib/db";
import { mockCompanySession } from "@/tests/fixtures/sessions";

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn((path, file) => ({
          error: null,
        })),
      })),
    },
  })),
}));

// Mock dependencies
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    document: {
      create: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth/next");
const { createClient } = require("@supabase/supabase-js");

describe("POST /api/company/documents", () => {
  const mockAccount = {
    id: 10,
  };

  const mockDocument = {
    id: 1,
    account_id: 10,
    doc_type_id: 5,
    file_path: "company-10/123456-test.pdf",
    file_name: "test.pdf",
    created_at: new Date("2024-01-01"),
    documentType: {
      name: "Business License",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if account not found", async () => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Account not found");
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    });

    it("should return 400 if file is missing", async () => {
      const formData = new FormData();
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing file or document type");
    });

    it("should return 400 if docTypeId is missing", async () => {
      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing file or document type");
    });

    it("should return 400 if file size exceeds 10MB", async () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], "large.pdf", { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", largeFile);
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("File size must be less than 10MB");
    });

    it("should return 400 if file is not PDF", async () => {
      const formData = new FormData();
      formData.append("file", new File(["content"], "test.txt", { type: "text/plain" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Only PDF files are allowed");
    });
  });

  describe("Document Upload", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    });

    it("should upload document successfully", async () => {
      (prisma.document.create as jest.Mock).mockResolvedValue(mockDocument);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.name).toBe("test.pdf");
      expect(data.type).toBe("Business License");
    });

    it("should call Supabase upload with correct path", async () => {
      (prisma.document.create as jest.Mock).mockResolvedValue(mockDocument);
      const mockSupabase = createClient();

      const formData = new FormData();
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      formData.append("file", file);
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      await POST(request);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("documents");
    });

    it("should save document to database with correct data", async () => {
      (prisma.document.create as jest.Mock).mockResolvedValue(mockDocument);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      await POST(request);

      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            account_id: 10,
            doc_type_id: 5,
            file_name: "test.pdf",
          }),
        })
      );
    });

    it("should handle Supabase upload errors", async () => {
      const mockSupabase = createClient();
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn(() => ({
          error: { message: "Upload failed" },
        })),
      });

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to upload document");
    });

    it("should handle database errors", async () => {
      (prisma.document.create as jest.Mock).mockRejectedValue(new Error("DB error"));

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to upload document");
    });
  });

  describe("Response Format", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (prisma.document.create as jest.Mock).mockResolvedValue(mockDocument);
    });

    it("should return correctly formatted document", async () => {
      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("url");
      expect(data).toHaveProperty("uploadedAt");
      expect(data).toHaveProperty("type");
    });
  });
});
