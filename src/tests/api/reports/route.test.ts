import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/reports/route";
import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    jobPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    application: {
      groupBy: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

describe("/api/reports POST", () => {
  const session = { user: { id: "12", email: "user@example.com" } };
  const request = (body: any) =>
    new NextRequest("http://localhost/api/reports", {
      method: "POST",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (getApiSession as jest.Mock).mockResolvedValue(session);
  });

  it("rejects unauthenticated requests", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(request({}));
    expect(res.status).toBe(401);
  });

  it("validates required fields", async () => {
    const res = await POST(
      request({ target_id: 1, report_type_id: 1, description: "" })
    );
    expect(res.status).toBe(400);
  });

  it("prevents duplicate reports", async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    const res = await POST(
      request({ target_type: "POST", target_id: 10, report_type_id: 1 })
    );

    expect(prisma.report.findFirst).toHaveBeenCalled();
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/already reported/);
  });

  it("creates a report and notifies admin", async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.report.create as jest.Mock).mockResolvedValue({
      id: 42,
      target_type: "POST",
      target_id: 5,
      description: "spam",
      account: { username: "Alice" },
      reportType: { name: "Spam" },
    });
    (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue({
      jobName: "Frontend Dev",
    });

    const res = await POST(
      request({ target_type: "POST", target_id: 5, report_type_id: 2, description: "spam" })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(42);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          account_id: 27,
          sender_id: 12,
          message: expect.stringContaining("Frontend Dev"),
        }),
      })
    );
  });

  it("handles general target without job lookup", async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.report.create as jest.Mock).mockResolvedValue({
      id: 1,
      target_type: "GENERAL",
      target_id: 0,
      description: "",
      account: { username: "Bob" },
      reportType: null,
    });

    const res = await POST(
      request({ target_type: "GENERAL", target_id: 0, report_type_id: null })
    );
    expect(res.status).toBe(201);
    expect(prisma.jobPost.findUnique).not.toHaveBeenCalled();
  });

  it("returns 500 on errors", async () => {
    (prisma.report.findFirst as jest.Mock).mockRejectedValue(new Error("DB down"));
    const res = await POST(
      request({ target_type: "POST", target_id: 1 })
    );
    expect(res.status).toBe(500);
  });
});

describe("/api/reports GET", () => {
  const baseReports = [
    {
      id: 1,
      target_type: "POST",
      target_id: 5,
      account: { username: "Alice" },
      reportType: { name: "Spam" },
    },
    {
      id: 2,
      target_type: "GENERAL",
      target_id: 0,
      account: { username: "Bob" },
      reportType: { name: "Abuse" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.report.findMany as jest.Mock).mockResolvedValue(baseReports);
    (prisma.jobPost.findMany as jest.Mock).mockResolvedValue([
      {
        id: 5,
        jobName: "Frontend Dev",
        company: { id: 1, name: "Tech", address: "Bangkok", account: { logoUrl: "", backgroundUrl: "" } },
        jobArrangement: { id: 1, name: "Hybrid" },
        jobType: { id: 1, name: "Full-time" },
        category: { id: 1, name: "Software" },
        tags: [],
      },
    ]);
    (prisma.application.groupBy as jest.Mock).mockResolvedValue([
      { job_post_id: 5, _count: { job_post_id: 3 } },
    ]);
    (prisma.report.groupBy as jest.Mock).mockResolvedValue([
      { target_id: 5, _count: { target_id: 4 } },
    ]);
  });

  const request = (query = "") =>
    new NextRequest(`http://localhost/api/reports${query}`);

  it("applies filters and returns augmented data", async () => {
    const res = await GET(request("?targetType=POST&reportTypeId=2&limit=5&sort=created_at"));
    expect(res.status).toBe(200);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { target_type: "POST", report_type_id: 2 },
        take: 5,
        orderBy: { created_at: "desc" },
      })
    );
    const data = await res.json();
    expect(data[0].jobPost.jobName).toBe("Frontend Dev");
    expect(data[0].jobPost.applied).toBe(3);
  });

  it("sorts by report count when requested", async () => {
    const res = await GET(request("?targetType=POST&sort=report_count"));
    expect(res.status).toBe(200);
    expect(prisma.report.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["target_id"] })
    );
  });

  it("returns 500 when fetching fails", async () => {
    (prisma.report.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));
    const res = await GET(request());
    expect(res.status).toBe(500);
  });
});
