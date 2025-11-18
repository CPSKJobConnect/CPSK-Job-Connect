/**
 * API Tests: Student Statistics Routes
 *
 * Endpoints:
 * - GET /api/students/[id]/statistics/summary - Summary stats
 * - GET /api/students/[id]/statistics/applied - Applications over time
 * - GET /api/students/[id]/statistics/status - Status distribution
 * - GET /api/students/[id]/statistics/category - Category distribution
 * - GET /api/students/[id]/statistics/interviewrate - Interview conversion rate
 *
 * ASVS Coverage:
 * - V5: Input Validation
 * - V7: Error Handling
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// Import route handlers
import { GET as getSummary } from "@/app/api/students/[id]/statistics/summary/route";
import { GET as getApplied } from "@/app/api/students/[id]/statistics/applied/route";
import { GET as getStatus } from "@/app/api/students/[id]/statistics/status/route";
import { GET as getCategory } from "@/app/api/students/[id]/statistics/category/route";
import { GET as getInterviewRate } from "@/app/api/students/[id]/statistics/interviewrate/route";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    application: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    savedJob: {
      count: jest.fn(),
    },
    applicationStatus: {
      findUnique: jest.fn(),
    },
    jobPost: {
      findUnique: jest.fn(),
    },
  },
}));

silenceConsole();

// ============================================================================
// GET /api/students/[id]/statistics/summary
// ============================================================================

describe("GET /api/students/[id]/statistics/summary", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.application.count as jest.Mock).mockResolvedValue(0);
    (prisma.savedJob.count as jest.Mock).mockResolvedValue(0);
  });

  describe("Input Validation", () => {
    it("returns 400 for invalid account ID", async () => {
      const req = new Request("http://localhost/api/students/abc/statistics/summary");
      const res = await getSummary(req, { params: Promise.resolve({ id: "abc" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account ID");
    });

    it("returns 404 when student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/999/statistics/summary");
      const res = await getSummary(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Success Cases", () => {
    it("returns summary statistics", async () => {
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(10) // applicationsSent
        .mockResolvedValueOnce(3)  // interviewsScheduled
        .mockResolvedValueOnce(2); // offersReceived
      (prisma.savedJob.count as jest.Mock).mockResolvedValue(5);

      const req = new Request("http://localhost/api/students/1/statistics/summary");
      const res = await getSummary(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        applicationsSent: 10,
        interviewsScheduled: 3,
        offersReceived: 2,
        savedJobs: 5,
      });
    });

    it("handles zero counts", async () => {
      const req = new Request("http://localhost/api/students/1/statistics/summary");
      const res = await getSummary(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        applicationsSent: 0,
        interviewsScheduled: 0,
        offersReceived: 0,
        savedJobs: 0,
      });
    });

    it("queries applications with status 3 for interviews", async () => {
      await getSummary(new Request("http://localhost/api/students/1/statistics/summary"), {
        params: Promise.resolve({ id: "1" }),
      });

      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { student_id: 1, status: 3 },
      });
    });

    it("queries applications with status 4 for offers", async () => {
      await getSummary(new Request("http://localhost/api/students/1/statistics/summary"), {
        params: Promise.resolve({ id: "1" }),
      });

      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { student_id: 1, status: 4 },
      });
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/students/1/statistics/summary");
      const res = await getSummary(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch data");
    });
  });
});

// ============================================================================
// GET /api/students/[id]/statistics/applied
// ============================================================================

describe("GET /api/students/[id]/statistics/applied", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.application.groupBy as jest.Mock).mockResolvedValue([]);
  });

  describe("Input Validation", () => {
    it("returns 400 for invalid account ID", async () => {
      const req = new Request("http://localhost/api/students/invalid/statistics/applied");
      const res = await getApplied(req, { params: Promise.resolve({ id: "invalid" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account ID");
    });

    it("returns 404 when student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/999/statistics/applied");
      const res = await getApplied(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Success Cases", () => {
    it("returns applications grouped by date", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { applied_at: new Date("2024-01-15"), _count: { id: 3 } },
        { applied_at: new Date("2024-01-20"), _count: { id: 5 } },
      ]);

      const req = new Request("http://localhost/api/students/1/statistics/applied");
      const res = await getApplied(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([
        { date: "15/01/2024", applicants: 3 },
        { date: "20/01/2024", applicants: 5 },
      ]);
    });

    it("handles empty results", async () => {
      const req = new Request("http://localhost/api/students/1/statistics/applied");
      const res = await getApplied(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("orders by applied_at ascending", async () => {
      await getApplied(new Request("http://localhost/api/students/1/statistics/applied"), {
        params: Promise.resolve({ id: "1" }),
      });

      expect(prisma.application.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { applied_at: "asc" },
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.application.groupBy as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/students/1/statistics/applied");
      const res = await getApplied(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch data");
    });
  });
});

// ============================================================================
// GET /api/students/[id]/statistics/status
// ============================================================================

describe("GET /api/students/[id]/statistics/status", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.application.groupBy as jest.Mock).mockResolvedValue([]);
  });

  describe("Input Validation", () => {
    it("returns 400 for invalid account ID", async () => {
      const req = new Request("http://localhost/api/students/xyz/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "xyz" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account ID");
    });

    it("returns 404 when student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/999/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Success Cases", () => {
    it("returns status distribution with names", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { status: 1, _count: { id: 10 } },
        { status: 2, _count: { id: 5 } },
      ]);
      (prisma.applicationStatus.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1, name: "Pending" })
        .mockResolvedValueOnce({ id: 2, name: "Reviewed" });

      const req = new Request("http://localhost/api/students/1/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([
        { name: "Pending", value: 10 },
        { name: "Reviewed", value: 5 },
      ]);
    });

    it("handles unknown status", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { status: 999, _count: { id: 3 } },
      ]);
      (prisma.applicationStatus.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/1/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([{ name: "Unknown", value: 3 }]);
    });

    it("handles empty results", async () => {
      const req = new Request("http://localhost/api/students/1/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.application.groupBy as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/students/1/statistics/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch data");
    });
  });
});

// ============================================================================
// GET /api/students/[id]/statistics/category
// ============================================================================

describe("GET /api/students/[id]/statistics/category", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.application.groupBy as jest.Mock).mockResolvedValue([]);
  });

  describe("Input Validation", () => {
    it("returns 400 for invalid account ID", async () => {
      const req = new Request("http://localhost/api/students/test/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "test" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account ID");
    });

    it("returns 404 when student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/999/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Success Cases", () => {
    it("returns category distribution", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { job_post_id: 1, _count: { id: 5 } },
        { job_post_id: 2, _count: { id: 3 } },
      ]);
      (prisma.jobPost.findUnique as jest.Mock)
        .mockResolvedValueOnce({ category: { name: "Engineering" } })
        .mockResolvedValueOnce({ category: { name: "Design" } });

      const req = new Request("http://localhost/api/students/1/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([
        { name: "Engineering", value: 5 },
        { name: "Design", value: 3 },
      ]);
    });

    it("aggregates same categories", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { job_post_id: 1, _count: { id: 5 } },
        { job_post_id: 2, _count: { id: 3 } },
      ]);
      (prisma.jobPost.findUnique as jest.Mock)
        .mockResolvedValueOnce({ category: { name: "Engineering" } })
        .mockResolvedValueOnce({ category: { name: "Engineering" } });

      const req = new Request("http://localhost/api/students/1/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([{ name: "Engineering", value: 8 }]);
    });

    it("handles unknown category", async () => {
      (prisma.application.groupBy as jest.Mock).mockResolvedValue([
        { job_post_id: 999, _count: { id: 2 } },
      ]);
      (prisma.jobPost.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/1/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([{ name: "Unknown", value: 2 }]);
    });

    it("handles empty results", async () => {
      const req = new Request("http://localhost/api/students/1/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.application.groupBy as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/students/1/statistics/category");
      const res = await getCategory(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch data");
    });
  });
});

// ============================================================================
// GET /api/students/[id]/statistics/interviewrate
// ============================================================================

describe("GET /api/students/[id]/statistics/interviewrate", () => {
  beforeEach(() => {
    resetAllMocks();
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe("Input Validation", () => {
    it("returns 400 for invalid account ID", async () => {
      const req = new Request("http://localhost/api/students/bad/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "bad" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid account ID");
    });

    it("returns 404 when student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new Request("http://localhost/api/students/999/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "999" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });
  });

  describe("Success Cases", () => {
    it("returns interview conversion rates by category", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Interview" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
      ]);

      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([
        { category: "Engineering", conversionRate: 33 }, // 1/3 = 33%
      ]);
    });

    it("handles multiple categories", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Interview" },
        },
        {
          jobPost: { category: { name: "Design" } },
          applicationStatus: { name: "Pending" },
        },
      ]);

      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([
        { category: "Engineering", conversionRate: 100 },
        { category: "Design", conversionRate: 0 },
      ]);
    });

    it("returns 0% for no interviews", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
      ]);

      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([{ category: "Engineering", conversionRate: 0 }]);
    });

    it("handles empty results", async () => {
      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("rounds conversion rate to integer", async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Interview" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
        {
          jobPost: { category: { name: "Engineering" } },
          applicationStatus: { name: "Pending" },
        },
      ]);

      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].conversionRate).toBe(17); // 1/6 = 16.67 rounded to 17
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      (prisma.application.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/students/1/statistics/interviewrate");
      const res = await getInterviewRate(req, { params: Promise.resolve({ id: "1" }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Failed to fetch data");
    });
  });
});
