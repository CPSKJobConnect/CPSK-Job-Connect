import { POST } from "@/app/api/company/documents/route";
import { prisma } from "@/lib/db";
import { FileValidationError } from "@/lib/filePolicy";
import { mockCompanySession } from "@/tests/fixtures/sessions";

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
    documentType: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/uploadDocument", () => ({
  uploadDocument: jest.fn(),
}));

const { getServerSession } = require("next-auth/next");
const { uploadDocument } = require("@/lib/uploadDocument");

describe("POST /api/company/documents", () => {
  const mockAccount = {
    id: 10,
  };

  const mockUploadedDocument = {
    id: 1,
    account_id: 10,
    doc_type_id: 7,
    file_path: "10/company_evidence.pdf",
    file_name: "company_evidence.pdf",
    created_at: new Date("2024-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.documentType.findUnique as jest.Mock).mockResolvedValue({
      id: 7,
      name: "Company Evidence",
    });
  });

  describe("authentication", () => {
    it("returns 401 when not authenticated", async () => {
      getServerSession.mockResolvedValue(null);
      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "7");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when account is missing", async () => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "7");

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

  describe("validation", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    });

    it("returns 400 if file missing", async () => {
      const formData = new FormData();
      formData.append("docTypeId", "7");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing file or document type");
    });

    it("rejects unsupported document types", async () => {
      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "5");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unsupported document type");
    });

    it("maps FileValidationError to 400 response", async () => {
      (uploadDocument as jest.Mock).mockRejectedValue(
        new FileValidationError("Invalid document")
      );

      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "7");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid document");
    });
  });

  describe("success path", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockCompanySession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (uploadDocument as jest.Mock).mockResolvedValue(mockUploadedDocument);
    });

    it("uploads document using shared helper", async () => {
      const file = new File(["content"], "evidence.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docTypeId", "7");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(uploadDocument).toHaveBeenCalledWith(file, "10", 7);
      expect(data).toEqual(
        expect.objectContaining({
          id: mockUploadedDocument.id,
          name: mockUploadedDocument.file_name,
          url: mockUploadedDocument.file_path,
          type: "Company Evidence",
        })
      );
    });

    it("handles unknown document type gracefully", async () => {
      (prisma.documentType.findUnique as jest.Mock).mockResolvedValue(null);
      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "7");

      const request = new Request("http://localhost/api/company/documents", {
        method: "POST",
        body: formData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.type).toBe("Document");
    });

    it("returns 500 for unexpected errors", async () => {
      (uploadDocument as jest.Mock).mockRejectedValue(new Error("Supabase offline"));

      const formData = new FormData();
      formData.append("file", new File(["content"], "evidence.pdf", { type: "application/pdf" }));
      formData.append("docTypeId", "7");

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
});
