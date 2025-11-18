import { NextRequest } from "next/server";
import { POST } from "@/app/api/company/reapply-verification/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/uploadDocument", () => ({
  uploadDocument: jest.fn(),
}));

jest.mock("@/lib/notifyAdmins", () => ({
  notifyAdminsCompanyReapplication: jest.fn().mockResolvedValue(undefined),
}));

describe("POST /api/company/reapply-verification", () => {
  const session = { user: { id: "5" } };

  const buildRequest = (file?: File) => {
    const formData = new FormData();
    if (file) formData.append("evidence", file);
    return new NextRequest("http://localhost/api/company/reapply-verification", {
      method: "POST",
      body: formData as any,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(session);
    (prisma.company.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Tech Corp",
      registration_status: "REJECTED",
    });
    (uploadDocument as jest.Mock).mockResolvedValue({ id: 10 });
  });

  it("requires authentication", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest(new File(["x"], "evidence.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(401);
  });

  it("validates evidence file", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 when company missing", async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest(new File(["x"], "evidence.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(404);
  });

  it("only allows rejected companies to reapply", async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Tech Corp",
      registration_status: "APPROVED",
    });
    const res = await POST(buildRequest(new File(["x"], "evidence.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(403);
  });

  it("uploads evidence, updates company, and notifies", async () => {
    const res = await POST(buildRequest(new File(["x"], "evidence.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(200);
    expect(uploadDocument).toHaveBeenCalledWith(expect.any(File), "5", 7);
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ registration_status: "PENDING" }),
    });
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    (prisma.company.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await POST(buildRequest(new File(["x"], "evidence.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(500);
  });
});
