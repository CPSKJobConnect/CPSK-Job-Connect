import { NextRequest } from "next/server";
import { GET } from "@/app/api/reports/filter/type/route";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    reportType: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/reports/filter/type", () => {
  it("returns all report types", async () => {
    (prisma.reportType.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
    const res = await GET(new NextRequest("http://localhost/api/reports/filter/type"));
    expect(res.status).toBe(200);
    expect(prisma.reportType.findMany).toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    (prisma.reportType.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await GET(new NextRequest("http://localhost/api/reports/filter/type"));
    expect(res.status).toBe(500);
  });
});
