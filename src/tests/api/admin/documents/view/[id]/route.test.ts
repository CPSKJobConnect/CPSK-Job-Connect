/**
 * Tests for Admin Document Viewer Route
 *
 * Endpoint: GET /api/admin/documents/view/[id]
 * Validates authentication, authorization, and error handling flows.
 */

import { GET } from "@/app/api/admin/documents/view/[id]/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";

import { mockAdminSession } from "@/tests/fixtures";
import { resetAllMocks, silenceConsole } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

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

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
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

// ============================================================================
// TEST DATA
// ============================================================================

const adminAccount = {
  id: 3,
  email: "admin@ku.th",
  accountRole: { name: "admin" },
};

const mockDocument = {
  id: 1,
  account_id: 2,
  file_name: "company_evidence.pdf",
  file_path: "documents/company-2/company_evidence.pdf",
  documentType: { id: 7, name: "Company Evidence" },
};

// ============================================================================
// HELPERS
// ============================================================================

function createRequest(id = "1") {
  return new Request(`http://localhost/api/admin/documents/view/${id}`);
}

async function callRoute(id = "1") {
  const request = createRequest(id);
  return GET(request, { params: Promise.resolve({ id }) });
}

// ============================================================================
// TESTS
// ============================================================================

describe("GET /api/admin/documents/view/[id]", () => {
  beforeEach(() => {
    resetAllMocks();

    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(adminAccount);
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(mockDocument);
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed-url/doc.pdf" },
      error: null,
    });
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not admin", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...adminAccount,
      accountRole: { name: "company" },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns 400 for invalid document ID", async () => {
    const res = await callRoute("abc");
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid document ID");
  });

  it("returns 404 when document is not found", async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Document not found");
  });

  it("returns signed URL for valid admin request", async () => {
    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      url: "https://signed-url/doc.pdf",
      fileName: mockDocument.file_name,
      fileType: mockDocument.documentType.name,
    });
    expect(mockSupabaseCreateSignedUrl).toHaveBeenCalledWith(
      mockDocument.file_path,
      300
    );
  });

  it("handles Supabase errors gracefully", async () => {
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Storage failed" },
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to generate download URL");
  });

  it("handles missing Supabase data responses", async () => {
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: undefined,
      error: null,
    });

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to generate download URL");
  });

  it("returns server error when database throws", async () => {
    (prisma.document.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    const res = await callRoute();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to get document");
  });

  it("creates Supabase client with configured credentials", async () => {
    await callRoute();

    expect(createClient).toHaveBeenCalledWith(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });
});
