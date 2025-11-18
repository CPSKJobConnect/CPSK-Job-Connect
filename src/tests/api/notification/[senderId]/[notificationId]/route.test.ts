import { PATCH } from "@/app/api/notification/[senderId]/[notificationId]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      updateMany: jest.fn(),
    },
  },
}));

describe("PATCH /api/notification/[senderId]/[notificationId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notification/2/1");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: {},
      });

      const request = new NextRequest("http://localhost:3000/api/notification/2/1");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Marking notification as read", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "user@example.com",
        role: "student",
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should mark notification as read successfully", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/5");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "5" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 5,
          account_id: 1,
        },
        data: { is_read: true },
      });
    });

    it("should return 404 if notification not found", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/999");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "999" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Notification not found or unauthorized");
    });

    it("should return 404 if notification belongs to different user", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/5");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "5" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Notification not found or unauthorized");

      // Verify that the query checked for the correct account_id
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 5,
          account_id: 1,
        },
        data: { is_read: true },
      });
    });

    it("should return 400 for invalid notification ID", async () => {
      const request = new NextRequest("http://localhost:3000/api/notification/2/invalid");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "invalid" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid notification ID");
      expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });

    it("should return 400 for non-numeric notification ID", async () => {
      const request = new NextRequest("http://localhost:3000/api/notification/2/abc123");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "abc123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid notification ID");
    });

    it("should handle database errors gracefully", async () => {
      (prisma.notification.updateMany as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = new NextRequest("http://localhost:3000/api/notification/2/5");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "5" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update notification");
    });

    it("should only update notification if it belongs to the authenticated user", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/10");
      await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "10" }),
      });

      // Verify that both notification ID and account ID are checked
      const callArgs = (prisma.notification.updateMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.id).toBe(10);
      expect(callArgs.where.account_id).toBe(1);
    });

    it("should set is_read to true", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/5");
      await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "5" }),
      });

      const callArgs = (prisma.notification.updateMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.is_read).toBe(true);
    });
  });

  describe("Edge cases", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "user@example.com",
        role: "student",
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should handle notification ID of 0", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/0");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "0" }),
      });

      expect(response.status).toBe(404);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 0,
          account_id: 1,
        },
        data: { is_read: true },
      });
    });

    it("should handle very large notification ID", async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/2/999999999");
      const response = await PATCH(request, {
        params: Promise.resolve({ senderId: "2", notificationId: "999999999" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 999999999,
          account_id: 1,
        },
        data: { is_read: true },
      });
    });
  });
});
