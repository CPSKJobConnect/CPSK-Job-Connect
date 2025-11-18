import { NextRequest } from "next/server";
import { GET } from "@/app/api/jobs/[id]/applicants/route";
import { prisma } from "@/lib/db";

const createSignedUrlMock = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: createSignedUrlMock,
      })),
    },
  })),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    application: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/jobs/[id]/applicants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://signed" } });
  });

  const request = (id: string) =>
    GET(new NextRequest(`http://localhost/api/jobs/${id}/applicants`), {
      params: Promise.resolve({ id }),
    });

  it("validates job id parameter", async () => {
    const res = await request("abc");
    expect(res.status).toBe(400);
  });

  it("returns mapped applicants with signed URLs", async () => {
    (prisma.application.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: "pending",
        applied_at: "2025-01-01",
        student: {
          id: 7,
          name: "Alice",
          student_id: "b123",
          phone: "08123",
          account: { email: "alice@example.com", logoUrl: "avatar.png" },
        },
        portfolioDocument: { file_path: "portfolio/alice.pdf" },
        resumeDocument: { file_path: "resume/alice.pdf" },
      },
    ]);

    const res = await request("10");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.job_id).toBe(10);
    expect(data.applicants[0]).toMatchObject({
      applicant_id: 7,
      portfolio: "https://signed",
      resume: "https://signed",
    });
  });

  it("handles Supabase errors gracefully by returning null URLs", async () => {
    createSignedUrlMock.mockResolvedValueOnce({ data: null });
    createSignedUrlMock.mockResolvedValueOnce({ data: null });
    (prisma.application.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: "pending",
        applied_at: "2025-01-01",
        student: {
          id: 7,
          name: "Alice",
          student_id: "b123",
          phone: "08123",
          account: { email: "alice@example.com", logoUrl: "avatar.png" },
        },
        portfolioDocument: { file_path: "portfolio/alice.pdf" },
        resumeDocument: { file_path: "resume/alice.pdf" },
      },
    ]);

    const res = await request("10");
    const data = await res.json();
    expect(data.applicants[0].portfolio).toBeNull();
    expect(data.applicants[0].resume).toBeNull();
  });

  it("returns 500 when underlying query fails", async () => {
    (prisma.application.findMany as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await request("5");
    expect(res.status).toBe(500);
  });
});
