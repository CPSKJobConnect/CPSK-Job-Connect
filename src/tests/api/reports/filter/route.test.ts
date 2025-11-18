import { NextRequest } from "next/server";
import { GET } from "@/app/api/reports/filter/route";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    reportType: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/reports/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches report types with optional target", async () => {
    (prisma.reportType.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: "Spam", target: "POST" },
    ]);

    const req = new NextRequest("http://localhost/api/reports/filter?target=POST");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.reportType.findMany).toHaveBeenCalledWith({
      where: { target: "POST" },
      select: { id: true, name: true, target: true },
    });
  });

  it("returns 500 on errors", async () => {
    (prisma.reportType.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
    const req = new NextRequest("http://localhost/api/reports/filter");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
