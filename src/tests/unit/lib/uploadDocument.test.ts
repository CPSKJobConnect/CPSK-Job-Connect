/**
 * Tests for uploadDocument utility
 */

import { uploadDocument } from "@/lib/uploadDocument";
import { prisma } from "@/lib/db";

const mockUpload = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  upload: mockUpload,
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    document: {
      create: jest.fn(),
    },
  },
}));

describe("uploadDocument", () => {
  const file = {
    name: "resume.pdf",
    type: "application/pdf",
  } as unknown as File;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("uploads the file and stores metadata", async () => {
    mockUpload.mockResolvedValue({
      data: { path: "123/resume_resume.pdf" },
      error: null,
    });
    (prisma.document.create as jest.Mock).mockResolvedValue({
      id: 1,
      account_id: 123,
    });

    const result = await uploadDocument(file, "123", 1);

    expect(mockStorageFrom).toHaveBeenCalledWith("documents");
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/123\/\d+_resume_resume\.pdf/),
      file,
      expect.objectContaining({ contentType: "application/pdf" })
    );
    expect(prisma.document.create).toHaveBeenCalledWith({
      data: {
        account_id: 123,
        doc_type_id: 1,
        file_name: "resume.pdf",
        file_path: "123/resume_resume.pdf",
      },
    });
    expect(result).toEqual({ id: 1, account_id: 123 });
  });

  it("throws when Supabase upload fails", async () => {
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: "Upload failed" },
    });

    await expect(uploadDocument(file, "123", 2)).rejects.toThrow(
      "Failed to upload file: Upload failed"
    );
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it("propagates Prisma errors", async () => {
    mockUpload.mockResolvedValue({
      data: { path: "123/doc_cv.pdf" },
      error: null,
    });
    (prisma.document.create as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    await expect(uploadDocument(file, "123", 2)).rejects.toThrow("DB error");
  });
});
