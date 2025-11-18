import { POST } from "@/app/api/company/profile-image/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const removeMock = jest.fn();
const uploadMock = jest.fn();
const signedUrlMock = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        remove: removeMock,
        upload: uploadMock,
        createSignedUrl: signedUrlMock,
      })),
    },
  })),
}));

describe("POST /api/company/profile-image", () => {
  const session = { user: { email: "company@example.com" } };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    (getServerSession as jest.Mock).mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 10 });
    uploadMock.mockResolvedValue({
      data: { path: "profile-images/10/file.png" },
      error: null,
    });
    signedUrlMock.mockResolvedValue({
      data: { signedUrl: "https://signed-url/image.png" },
      error: null,
    });
  });

  function buildRequest(file?: File) {
    const formData = new FormData();
    if (file) formData.append("file", file);
    return new NextRequest("http://localhost/api/company/profile-image", {
      method: "POST",
      body: formData as any,
    });
  }

  it("requires authentication", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when account missing", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const file = new File(["image"], "pic.png", { type: "image/png" });
    const res = await POST(buildRequest(file));
    expect(res.status).toBe(404);
  });

  it("validates file presence and type", async () => {
    const noFileRes = await POST(buildRequest());
    expect(noFileRes.status).toBe(400);

    const badFile = new File(["data"], "doc.pdf", { type: "application/pdf" });
    const badRes = await POST(buildRequest(badFile));
    expect(badRes.status).toBe(400);
  });

  it("validates file size limit", async () => {
    const largeFile = new File(["a".repeat(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    Object.defineProperty(largeFile, "size", { value: 6 * 1024 * 1024 + 1 });
    const res = await POST(buildRequest(largeFile));
    expect(res.status).toBe(400);
  });

  it("uploads new image and updates account", async () => {
    (prisma.account.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce({ id: 10, logoUrl: "old/path.png" });

    const file = new File(["image"], "pic.png", { type: "image/png" });
    const res = await POST(buildRequest(file));
    const data = await res.json();

    expect(removeMock).toHaveBeenCalledWith(["old/path.png"]);
    expect(uploadMock).toHaveBeenCalled();
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { logoUrl: "https://signed-url/image.png" },
    });
    expect(data.profile_url).toBe("https://signed-url/image.png");
    expect(res.status).toBe(200);
  });

  it("handles upload and signed URL errors", async () => {
    const file = new File(["image"], "pic.png", { type: "image/png" });

    uploadMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Upload failed" },
    });
    let res = await POST(buildRequest(file));
    expect(res.status).toBe(500);

    uploadMock.mockResolvedValue({
      data: { path: "profile-images/10/file.png" },
      error: null,
    });
    signedUrlMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Sign failed" },
    });
    res = await POST(buildRequest(file));
    expect(res.status).toBe(500);
  });
});
