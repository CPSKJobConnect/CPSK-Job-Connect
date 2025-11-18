import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/reports/[id]/route";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    report: {
      update: jest.fn(),
    },
  },
}));

describe("PATCH /api/reports/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const request = (body: any) =>
    new NextRequest("http://localhost/api/reports/1", {
      method: "PATCH",
      body: JSON.stringify(body),
    });

  it("validates is_resolved field", async () => {
    const res = await PATCH(request({}), { params: { id: "1" } });
    expect(res.status).toBe(400);
  });

  it("updates report resolution flag", async () => {
    (prisma.report.update as jest.Mock).mockResolvedValue({
      id: 1,
      is_resolved: true,
    });

    const res = await PATCH(request({ is_resolved: true }), { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(prisma.report.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { is_resolved: true },
    });
  });

  it("returns 500 on errors", async () => {
    (prisma.report.update as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await PATCH(request({ is_resolved: true }), { params: { id: "1" } });
    expect(res.status).toBe(500);
  });
});
