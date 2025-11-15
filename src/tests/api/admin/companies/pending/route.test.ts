// Tests for pending companies logic and authorization
import { GET } from "@/app/api/admin/companies/pending/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";

// Mock modules
jest.mock("@/lib/db", () => ({
  prisma: {
    company: { findMany: jest.fn() },
  },
}));

// Mock next-auth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
}));

// Polyfill Request/Response for Node (if needed later)
(global as any).Request = class {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
};

describe("GET /api/admin/companies/pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test fetching pending companies
  it("fetches pending companies from Prisma correctly", async () => {
    const mockData = [
      {
        id: 1,
        name: "Tech Corp",
        registration_status: "pending",
        account: {
          documents: [
            {
              id: 99,
              documentType: { name: "Company Evidence" },
            },
          ],
        },
      },
    ];

    (prisma.company.findMany as jest.Mock).mockResolvedValue(mockData);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" },
    });

    const res = await GET();
    const data = await res.json();

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { registration_status: "pending" },
        include: expect.any(Object),
      })
    );

    expect(res.status).toBe(200);
    expect(data).toEqual(mockData);
  });

  // Test authorization
  it("returns 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test non-admin access
  it("returns 403 if user is not admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "student@example.com", role: "student" },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  // Test error handling when Prisma throws an error
  it("returns 500 if Prisma throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence expected error

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" },
    });
    (prisma.company.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to fetch pending companies");
  });
});
