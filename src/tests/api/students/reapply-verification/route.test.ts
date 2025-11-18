import { NextRequest } from "next/server";
import { POST } from "@/app/api/students/reapply-verification/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { uploadDocument } from "@/lib/uploadDocument";
import { notifyAdminsAlumniReapplication } from "@/lib/notifyAdmins";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
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
  notifyAdminsAlumniReapplication: jest.fn(),
}));

describe("POST /api/students/reapply-verification", () => {
  const session = { user: { id: "9" } };

  const buildRequest = (file?: File) => {
    const formData = new FormData();
    if (file) formData.append("transcript", file);
    return new NextRequest("http://localhost/api/students/reapply-verification", {
      method: "POST",
      body: formData as any,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(session);
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Alice",
      student_id: "b123",
      student_status: "ALUMNI",
      verification_status: "REJECTED",
    });
    (uploadDocument as jest.Mock).mockResolvedValue({ id: 20 });
    (notifyAdminsAlumniReapplication as jest.Mock).mockResolvedValue(undefined);
  });

  it("requires authentication", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest(new File(["x"], "transcript.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(401);
  });

  it("validates transcript file", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 when student not found", async () => {
    (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest(new File(["x"], "transcript.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(404);
  });

  it("allows only rejected alumni to reapply", async () => {
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Alice",
      student_id: "b123",
      student_status: "CURRENT",
      verification_status: "REJECTED",
    });
    const res = await POST(buildRequest(new File(["x"], "transcript.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(403);
  });

  it("uploads transcript, updates status, and notifies admins", async () => {
    const file = new File(["x"], "transcript.pdf", { type: "application/pdf" });
    const res = await POST(buildRequest(file));
    expect(res.status).toBe(200);
    expect(uploadDocument).toHaveBeenCalledWith(file, "9", 4);
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ verification_status: "PENDING" }),
    });
    expect(notifyAdminsAlumniReapplication).toHaveBeenCalledWith(
      "Alice",
      "b123",
      9
    );
  });

  it("returns 500 on unexpected errors", async () => {
    (prisma.student.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await POST(buildRequest(new File(["x"], "transcript.pdf", { type: "application/pdf" })));
    expect(res.status).toBe(500);
  });
});
