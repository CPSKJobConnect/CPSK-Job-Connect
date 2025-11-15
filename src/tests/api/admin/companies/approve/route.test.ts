import { POST } from "@/app/api/admin/companies/approve/route";
import * as approveLogic from "@/app/api/admin/companies/approve/approve.logic";
import { getServerSession } from "next-auth/next";

// Polyfill Request for Jest (Node doesn't have it by default)
(global as any).Request = class {
  url: string;
  method: string;
  body: any;

  constructor(url: string, init?: any) {
    this.url = url;
    this.method = init?.method || "GET";
    this.body = init?.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock NextResponse
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

// Mock approve logic
jest.mock("@/app/api/admin/companies/approve/approve.logic", () => ({
  postApproveCompany: jest.fn(),
}));

// Silence noisy console logs (optional)
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("POST /api/admin/companies/approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for unauthorized access
  it("returns 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost/api/admin/companies/approve", {
      method: "POST",
      body: JSON.stringify({ companyId: 1, action: "approve" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test for forbidden access
  it("returns 403 if user is not admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "user@example.com", role: "user" },
    });

    const req = new Request("http://localhost/api/admin/companies/approve", {
      method: "POST",
      body: JSON.stringify({ companyId: 1, action: "approve" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  // Test for successful approval
  it("approves a company successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" },
    });

    (approveLogic.postApproveCompany as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Mock Company",
    });

    const req = new Request("http://localhost/api/admin/companies/approve", {
      method: "POST",
      body: JSON.stringify({ companyId: 1, action: "approve" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      message: "Company approve successfully",
      company: { id: 1, name: "Mock Company" },
    });
  });

  it("handles errors gracefully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" },
    });

    (approveLogic.postApproveCompany as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost/api/admin/companies/approve", {
      method: "POST",
      body: JSON.stringify({ companyId: 1, action: "approve" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to update company status");
  });
});
