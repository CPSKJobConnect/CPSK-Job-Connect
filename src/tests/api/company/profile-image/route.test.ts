import { POST } from "@/app/api/company/profile-image/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { uploadImage } from "@/lib/uploadImage";
import { FileValidationError } from "@/lib/filePolicy";

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

jest.mock("@/lib/uploadImage", () => ({
  uploadImage: jest.fn(),
}));

describe("POST /api/company/profile-image", () => {
  const session = { user: { email: "company@example.com" } };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(session);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 10 });
    (uploadImage as jest.Mock).mockResolvedValue("https://signed-url/image.png");
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
    const file = new File(["image"], "pic.png", { type: "image/png" });
    const res = await POST(buildRequest(file));
    const data = await res.json();

    expect(uploadImage).toHaveBeenCalledWith(file, "10", "logo");
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { logoUrl: "https://signed-url/image.png" },
    });
    expect(data.profile_url).toBe("https://signed-url/image.png");
    expect(res.status).toBe(200);
  });

  it("handles upload and signed URL errors", async () => {
    const file = new File(["image"], "pic.png", { type: "image/png" });

    (uploadImage as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));
    let res = await POST(buildRequest(file));
    expect(res.status).toBe(500);

    (uploadImage as jest.Mock).mockRejectedValueOnce(
      new FileValidationError("Invalid content")
    );
    res = await POST(buildRequest(file));
    expect(res.status).toBe(400);
  });
});
