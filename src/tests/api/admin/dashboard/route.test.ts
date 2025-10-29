import { GET } from "@/app/api/admin/dashboard/stats/route";
import * as statsLogic from "@/app/api/admin/dashboard/stats/stats.logic";
import { getServerSession } from "next-auth/next";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      body,
      status: opts?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}));

// Mock NextAuth session
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock stats logic
jest.mock("@/app/api/admin/dashboard/stats/stats.logic", () => ({
  getDashboardStats: jest.fn(),
}));

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 if user is not admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "user@example.com", role: "student" },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns 200 and stats for admin users", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" },
    });

    (statsLogic.getDashboardStats as jest.Mock).mockResolvedValue({
      totalStudents: 50,
      totalJobPosts: 15,
      averageSalary: { min: 20000, max: 40000, overall: 30000 },
      pendingCompanies: 2,
      totalCompanies: 10,
      reportedPosts: 3,
      topHiringCompanies: [],
      successRateByDepartment: [],
      topSkills: [],
      recentReports: [],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalStudents).toBe(50);
    expect(data.averageSalary.overall).toBe(30000);
  });
});
