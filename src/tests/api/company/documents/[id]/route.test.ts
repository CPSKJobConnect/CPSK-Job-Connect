import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/company/documents/[id]/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => {
  const remove = jest.fn();
  const from = jest.fn(() => ({
    remove,
  }));
  return {
    createClient: jest.fn(() => ({
      storage: { from },
    })),
    __mock: { remove, from },
  };
});
const { __mock } = require("@supabase/supabase-js") as { __mock: { remove: jest.Mock } };
const mockRemove = __mock.remove;

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const request = (id = "1") =>
  new NextRequest(`http://localhost/api/company/documents/${id}`, {
    method: "DELETE",
  });

describe("DELETE /api/company/documents/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "company@example.com" },
    });
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 10 });
    (prisma.document.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      file_path: "company-10/doc.pdf",
    });
  });

  it("requires authentication", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(request(), { params: { id: "1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when account is missing", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(request(), { params: { id: "1" } });
    expect(res.status).toBe(404);
  });

  it("returns 404 when document is not found", async () => {
    (prisma.document.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(request(), { params: { id: "1" } });
    expect(res.status).toBe(404);
  });

  it("deletes document and ignores storage failure", async () => {
    mockRemove.mockResolvedValue({ error: null });

    const res = await DELETE(request(), { params: { id: "1" } });

    expect(res.status).toBe(200);
    expect(mockRemove).toHaveBeenCalledWith(["company-10/doc.pdf"]);
    expect(prisma.document.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 500 on unexpected errors", async () => {
    (prisma.document.findFirst as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );
    const res = await DELETE(request(), { params: { id: "1" } });
    expect(res.status).toBe(500);
  });
});
