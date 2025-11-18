import { GET } from "@/app/api/notification/[senderId]/route";
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
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe("GET /api/notification/[senderId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      const response = await GET(request, { params: Promise.resolve({ senderId: "2" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: {},
      });

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      const response = await GET(request, { params: Promise.resolve({ senderId: "2" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Fetching messages from sender", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "user@example.com",
        role: "student",
      },
    };

    const mockMessages = [
      {
        id: 1,
        account_id: 1,
        sender_id: 2,
        message: "Hello",
        is_read: false,
        created_at: new Date("2024-01-01"),
      },
      {
        id: 2,
        account_id: 1,
        sender_id: 2,
        message: "How are you?",
        is_read: false,
        created_at: new Date("2024-01-02"),
      },
    ];

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should fetch all messages from a specific sender", async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      const response = await GET(request, { params: Promise.resolve({ senderId: "2" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].message).toBe("Hello");
      expect(data[1].message).toBe("How are you?");

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: 2 },
        orderBy: { created_at: "desc" },
      });
    });

    it("should mark all messages from sender as read", async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      await GET(request, { params: Promise.resolve({ senderId: "2" }) });

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: 2, is_read: false },
        data: { is_read: true },
      });
    });

    it("should handle system messages (senderId: system)", async () => {
      const systemMessages = [
        {
          id: 3,
          account_id: 1,
          sender_id: null,
          message: "System notification",
          is_read: false,
          created_at: new Date("2024-01-01"),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(systemMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/system");
      const response = await GET(request, { params: Promise.resolve({ senderId: "system" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].sender_id).toBeNull();

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: null },
        orderBy: { created_at: "desc" },
      });

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: null, is_read: false },
        data: { is_read: true },
      });
    });

    it("should handle null sender (senderId: null)", async () => {
      const nullSenderMessages = [
        {
          id: 4,
          account_id: 1,
          sender_id: null,
          message: "Null sender notification",
          is_read: false,
          created_at: new Date("2024-01-01"),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(nullSenderMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const request = new NextRequest("http://localhost:3000/api/notification/null");
      const response = await GET(request, { params: Promise.resolve({ senderId: "null" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: null },
        orderBy: { created_at: "desc" },
      });
    });

    it("should return empty array when no messages from sender", async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost:3000/api/notification/99");
      const response = await GET(request, { params: Promise.resolve({ senderId: "99" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should order messages by created_at descending", async () => {
      const orderedMessages = [
        {
          id: 2,
          account_id: 1,
          sender_id: 2,
          message: "Newer message",
          is_read: false,
          created_at: new Date("2024-01-02"),
        },
        {
          id: 1,
          account_id: 1,
          sender_id: 2,
          message: "Older message",
          is_read: false,
          created_at: new Date("2024-01-01"),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(orderedMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      const response = await GET(request, { params: Promise.resolve({ senderId: "2" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].message).toBe("Newer message");
      expect(data[1].message).toBe("Older message");

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { created_at: "desc" },
      });
    });

    it("should not update already read messages", async () => {
      const readMessages = [
        {
          id: 1,
          account_id: 1,
          sender_id: 2,
          message: "Already read",
          is_read: true,
          created_at: new Date("2024-01-01"),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(readMessages);
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost:3000/api/notification/2");
      await GET(request, { params: Promise.resolve({ senderId: "2" }) });

      // Verify that updateMany still filters for is_read: false
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { account_id: 1, sender_id: 2, is_read: false },
        data: { is_read: true },
      });
    });
  });
});
