/**
 * Tests for Student Profile Image Upload API
 *
 * Endpoint:
 * - POST /api/students/profile-image - Upload profile image
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control
 * - V5: Input Validation & File Upload
 * - V7: Error Handling
 * - V12: File and Resources
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/students/profile-image/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

import { mockStudentAccount, mockStudentSession } from "@/tests/fixtures";
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/api-auth");
jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockSupabaseUpload = jest.fn();
const mockSupabaseCreateSignedUrl = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: mockSupabaseUpload,
        createSignedUrl: mockSupabaseCreateSignedUrl,
      })),
    },
  })),
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

silenceConsole();

// ============================================================================
// POST /api/students/profile-image
// ============================================================================

describe("POST /api/students/profile-image", () => {
  beforeEach(() => {
    resetAllMocks();
    mockSupabaseUpload.mockReset();
    mockSupabaseCreateSignedUrl.mockReset();
  });

  const createMockFile = (name: string = "profile.jpg", type: string = "image/jpeg") => {
    const blob = new Blob(["fake image content"], { type });
    return new File([blob], name, { type });
  };

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    it("returns 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: { email: "student@ku.th" },
      });

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ==========================================================================
  // INPUT VALIDATION TESTS
  // ==========================================================================

  describe("Input Validation", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockStudentAccount);
    });

    it("returns 400 if no file provided", async () => {
      const formData = new FormData();

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("No file provided");
    });

    it("returns 400 if file is not an image", async () => {
      const formData = new FormData();
      formData.append("file", createMockFile("document.pdf", "application/pdf"));

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("File must be an image");
    });

    it("accepts valid image types", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockStudentAccount);
      (prisma.account.update as jest.Mock).mockResolvedValue({
        ...mockStudentAccount,
        logoUrl: "https://example.com/image.jpg",
      });
      mockSupabaseUpload.mockResolvedValue({
        data: { path: "profile-images/1/image.jpg" },
        error: null,
      });
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://example.com/image.jpg" },
        error: null,
      });

      const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      for (const type of imageTypes) {
        const formData = new FormData();
        formData.append("file", createMockFile(`image.${type.split("/")[1]}`, type));

        const req = new NextRequest("http://localhost/api/students/profile-image", {
          method: "POST",
          body: formData,
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
      }
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS
  // ==========================================================================

  describe("Authorization", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    });

    it("returns 404 if account not found", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Account not found");
    });
  });

  // ==========================================================================
  // SUCCESS TESTS
  // ==========================================================================

  describe("Profile Image Upload", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockStudentAccount);
      (prisma.account.update as jest.Mock).mockResolvedValue({
        ...mockStudentAccount,
        logoUrl: "https://example.com/signed-url/image.jpg",
      });
      mockSupabaseUpload.mockResolvedValue({
        data: { path: "profile-images/1/1234567890_profile.jpg" },
        error: null,
      });
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://example.com/signed-url/image.jpg" },
        error: null,
      });
    });

    it("uploads profile image successfully", async () => {
      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("successfully");
      expect(data.profile_url).toBe("https://example.com/signed-url/image.jpg");
    });

    it("uploads file to Supabase", async () => {
      const formData = new FormData();
      const mockFile = createMockFile("test.jpg");
      formData.append("file", mockFile);

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      await POST(req);

      expect(mockSupabaseUpload).toHaveBeenCalledWith(
        expect.stringContaining("profile-images/1/"),
        mockFile
      );
    });

    it("creates signed URL for uploaded image", async () => {
      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      await POST(req);

      expect(mockSupabaseCreateSignedUrl).toHaveBeenCalledWith(
        "profile-images/1/1234567890_profile.jpg",
        31536000
      );
    });

    it("updates account with new logoUrl", async () => {
      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      await POST(req);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: mockStudentAccount.id },
        data: {
          logoUrl: "https://example.com/signed-url/image.jpg",
        },
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockStudentAccount);
    });

    it("handles Supabase upload errors", async () => {
      mockSupabaseUpload.mockResolvedValue({
        data: null,
        error: { message: "Upload failed" },
      });

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to upload image");
    });

    it("handles signed URL generation errors", async () => {
      mockSupabaseUpload.mockResolvedValue({
        data: { path: "profile-images/1/image.jpg" },
        error: null,
      });
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Failed to create signed URL" },
      });

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to generate image URL");
    });

    it("handles database errors gracefully", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB connection failed")
      );

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to update profile image");
    });

    it("does not expose internal error details", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("Internal database schema details")
      );

      const formData = new FormData();
      formData.append("file", createMockFile());

      const req = new NextRequest("http://localhost/api/students/profile-image", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.error).toBe("Failed to update profile image");
      expect(data.error).not.toContain("schema");
      expect(data).not.toHaveProperty("stack");
    });
  });
});
