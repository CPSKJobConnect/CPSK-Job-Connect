/**
 * Tests for uploadDocument utility
 */

import { uploadDocument } from "@/lib/uploadDocument";
import { prisma } from "@/lib/db";
import { validateFileAgainstPolicy } from "@/lib/filePolicy";

jest.mock("@supabase/supabase-js", () => {
  const uploadMock = jest.fn();
  const fromMock = jest.fn(() => ({
    upload: uploadMock,
  }));
  return {
    __esModule: true,
    createClient: jest.fn(() => ({
      storage: {
        from: fromMock,
      },
    })),
    _uploadMock: uploadMock,
    _fromMock: fromMock,
  };
});

const { _uploadMock, _fromMock } = require("@supabase/supabase-js");
const mockUpload = _uploadMock as jest.Mock;
const mockStorageFrom = _fromMock as jest.Mock;

jest.mock("@/lib/db", () => ({
  prisma: {
    document: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/filePolicy", () => {
  const actual = jest.requireActual("@/lib/filePolicy");
  return {
    ...actual,
    validateFileAgainstPolicy: jest.fn(async () => ({
      sanitizedFileName: "resume.pdf",
      extension: "pdf",
    })),
  };
});

describe("uploadDocument", () => {
  const file = {
    name: "resume.pdf",
    type: "application/pdf",
  } as unknown as File;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    mockUpload.mockReset();
    mockStorageFrom.mockReset();
    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
    });
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
    expect(validateFileAgainstPolicy).toHaveBeenCalled();
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
