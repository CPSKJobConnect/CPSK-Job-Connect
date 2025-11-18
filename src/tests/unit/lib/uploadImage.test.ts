/**
 * Tests for uploadImage utility
 */

import { uploadImage } from "@/lib/uploadImage";

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  upload: mockUpload,
  createSignedUrl: mockCreateSignedUrl,
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

describe("uploadImage", () => {
  const file = {
    name: "avatar.png",
    type: "image/png",
  } as unknown as File;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("uploads image and returns signed URL", async () => {
    mockUpload.mockResolvedValue({
      data: { path: "profile-images/1/logo_123_avatar.png" },
      error: null,
    });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed-url/avatar.png" },
      error: null,
    });

    const url = await uploadImage(file, "1", "logo");

    expect(mockStorageFrom).toHaveBeenCalledWith("documents");
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/profile-images\/1\/logo_\d+_avatar\.png/),
      file
    );
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      "profile-images/1/logo_123_avatar.png",
      31536000
    );
    expect(url).toBe("https://signed-url/avatar.png");
  });

  it("throws when storage upload fails", async () => {
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: "Upload failed" },
    });

    await expect(uploadImage(file, "1", "logo")).rejects.toThrow(
      "Failed to upload image: Upload failed"
    );
  });

  it("throws when signed URL generation fails", async () => {
    mockUpload.mockResolvedValue({
      data: { path: "profile-images/1/logo_123_avatar.png" },
      error: null,
    });
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Sign error" },
    });

    await expect(uploadImage(file, "1", "background")).rejects.toThrow(
      "Failed to generate image URL: Sign error"
    );
  });
});
