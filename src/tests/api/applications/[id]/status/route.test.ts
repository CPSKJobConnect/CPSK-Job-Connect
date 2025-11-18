import { PATCH } from "@/app/api/applications/[id]/status/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    application: {
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

describe("PATCH /api/applications/[id]/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/applications/1/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: {} });

      const request = new Request("http://localhost:3000/api/applications/1/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Company verification", () => {
    const mockSession = {
      user: { id: "1", email: "company@example.com" },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should return 403 if company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/applications/1/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Company not verified");
    });

    it("should return 403 if company not approved", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        registration_status: "PENDING",
      });

      const request = new Request("http://localhost:3000/api/applications/1/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Company not verified");
      expect(data.message).toBe("Only verified companies can manage applications");
    });

    it("should allow approved companies", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        registration_status: "APPROVED",
      });
      (prisma.application.update as jest.Mock).mockResolvedValue({
        id: 1,
        status: 2,
        jobPost: { jobName: "Software Engineer" },
        applicationStatus: { name: "Accepted" },
        student: { account_id: 10 },
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost:3000/api/applications/1/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(200);
    });
  });

  describe("Updating application status", () => {
    const mockSession = {
      user: { id: "1", email: "company@example.com" },
    };

    const mockUpdatedApplication = {
      id: 5,
      status: 2,
      jobPost: { jobName: "Software Engineer" },
      applicationStatus: { name: "Accepted" },
      student: {
        account_id: 10,
        account: { email: "student@example.com" },
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        registration_status: "APPROVED",
      });
    });

    it("should update application status successfully", async () => {
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.application).toBeDefined();
      expect(data.application.status).toBe(2);
    });

    it("should return 400 for invalid application ID", async () => {
      const request = new Request("http://localhost:3000/api/applications/invalid/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid application ID");
    });

    it("should return 400 if status_id is missing", async () => {
      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("status_id is required");
    });

    it("should create notification for student", async () => {
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      await PATCH(request, { params: Promise.resolve({ id: "5" }) });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          account_id: 10,
          message: 'Your application for "Software Engineer" has been updated to "Accepted".',
          sender_id: 1,
        },
      });
    });

    it("should include job and status details in notification", async () => {
      const customApplication = {
        ...mockUpdatedApplication,
        jobPost: { jobName: "Product Manager" },
        applicationStatus: { name: "Rejected" },
      };

      (prisma.application.update as jest.Mock).mockResolvedValue(customApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 3 }),
      });

      await PATCH(request, { params: Promise.resolve({ id: "5" }) });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          account_id: 10,
          message: 'Your application for "Product Manager" has been updated to "Rejected".',
          sender_id: 1,
        },
      });
    });

    it("should call update with correct parameters", async () => {
      (prisma.application.update as jest.Mock).mockResolvedValue(mockUpdatedApplication);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      await PATCH(request, { params: Promise.resolve({ id: "5" }) });

      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: 2 },
        include: {
          applicationStatus: true,
          jobPost: { select: { jobName: true } },
          student: {
            include: { account: true },
          },
        },
      });
    });

    it("should handle database errors", async () => {
      (prisma.application.update as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost:3000/api/applications/5/status", {
        method: "PATCH",
        body: JSON.stringify({ status_id: 2 }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "5" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update status");
    });
  });
});
