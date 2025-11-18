/**
 * Tests for Company Document Viewer Route
 *
 * Endpoint: GET /api/company/documents/view/[id]
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/company/documents/view/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
    },
  },
}));

const mockSupabaseCreateSignedUrl = jest.fn();
const mockSupabaseFrom = jest.fn(() => ({
  createSignedUrl: mockSupabaseCreateSignedUrl,
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: mockSupabaseFrom,
    },
  })),
}));

silenceConsole();

const mockSession = {
  user: {
    email: "company@example.com",
  },
};

const mockAccount = {
  id: 10,
  email: "company@example.com",
  accountRole: { name: "company" },
  company: { id: 20 },
};

const ownDocument = {
  id: 1,
  account_id: 10,
  file_path: "company-10/evidence.pdf",
  file_name: "evidence.pdf",
  documentType: { name: "Company Evidence" },
  account: {
    student: null,
  },
};

function createRequest(id = "1") {
  return new NextRequest(`http://localhost/api/company/documents/view/${id}`);
}

async function callRoute(id = "1") {
  const request = createRequest(id);
  return GET(request, { params: Promise.resolve({ id }) });
}

describe("GET /api/company/documents/view/[id]", () => {
  beforeEach(() => {
    resetAllMocks();
    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(ownDocument);
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed-url/doc.pdf" },
      error: null,
    });
  });

  it("returns 401 when session missing", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when account is not company", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...mockAccount,
      accountRole: { name: "student" },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns 400 for invalid document id", async () => {
    const res = await callRoute("abc");
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid document ID");
  });

  it("returns 404 when document not found", async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Document not found");
  });

  it("returns 403 when company has no access to the document", async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({
      ...ownDocument,
      account_id: 99,
      account: {
        student: {
          applications: [],
        },
      },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden - No access to this document");
  });

  it("allows access when document belongs to applicant", async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({
      ...ownDocument,
      account_id: 99,
      account: {
        student: {
          applications: [{ id: 1 }],
        },
      },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toBe("https://signed-url/doc.pdf");
  });

  it("returns signed URL for own document", async () => {
    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      url: "https://signed-url/doc.pdf",
      fileName: "evidence.pdf",
      fileType: "Company Evidence",
    });
    expect(mockSupabaseCreateSignedUrl).toHaveBeenCalledWith(
      "company-10/evidence.pdf",
      3600
    );
  });

  it("handles Supabase errors", async () => {
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Storage error" },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to generate download URL");
  });

  it("returns 500 when database throws", async () => {
    (prisma.document.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to get document");
  });
});
