import { GET } from "@/app/api/notification/route";
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
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({
        user: {},
      });

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Fetching notifications", () => {
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

    it("should return empty array when no notifications exist", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { account_id: 1 },
        select: { id: true },
      });
      expect(prisma.notification.findMany).not.toHaveBeenCalled();
    });

    it("should return notifications with sender username", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Test message",
          is_read: false,
          created_at: new Date("2024-01-01"),
          sender: {
            id: 2,
            username: "testuser",
            logoUrl: "http://example.com/logo.png",
            student: null,
            company: null,
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual({
        senderId: 2,
        senderName: "testuser",
        senderLogo: "http://example.com/logo.png",
        message: "Test message",
        is_read: false,
        created_at: expect.any(String),
      });
    });

    it("should return notifications with student name when no username", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Test message",
          is_read: false,
          created_at: new Date("2024-01-01"),
          sender: {
            id: 2,
            username: null,
            logoUrl: null,
            student: { name: "John Doe" },
            company: null,
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].senderName).toBe("John Doe");
      expect(data[0].senderLogo).toBeNull();
    });

    it("should return notifications with company name when no username or student", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Test message",
          is_read: true,
          created_at: new Date("2024-01-01"),
          sender: {
            id: 2,
            username: null,
            logoUrl: null,
            student: null,
            company: { name: "Acme Corp" },
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].senderName).toBe("Acme Corp");
      expect(data[0].is_read).toBe(true);
    });

    it("should return 'System' as sender name when no sender info available", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Test message",
          is_read: false,
          created_at: new Date("2024-01-01"),
          sender: {
            id: 2,
            username: null,
            logoUrl: null,
            student: null,
            company: null,
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].senderName).toBe("System");
    });

    it("should return only latest notification per sender", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Latest from sender 2",
          is_read: false,
          created_at: new Date("2024-01-02"),
          sender: {
            id: 2,
            username: "user2",
            logoUrl: null,
            student: null,
            company: null,
          },
        },
        {
          sender_id: 3,
          message: "Latest from sender 3",
          is_read: true,
          created_at: new Date("2024-01-01"),
          sender: {
            id: 3,
            username: "user3",
            logoUrl: null,
            student: null,
            company: null,
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].senderId).toBe(2);
      expect(data[1].senderId).toBe(3);

      // Verify that distinct and orderBy were used
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { account_id: 1 },
        orderBy: { created_at: "desc" },
        distinct: ["sender_id"],
        include: expect.any(Object),
      });
    });

    it("should set cache-control header", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);

      expect(response.headers.get("Cache-Control")).toBe("private, max-age=30");
    });

    it("should set cache-control header when notifications exist", async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          sender_id: 2,
          message: "Test",
          is_read: false,
          created_at: new Date(),
          sender: {
            id: 2,
            username: "test",
            logoUrl: null,
            student: null,
            company: null,
          },
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/notification");
      const response = await GET(request);

      expect(response.headers.get("Cache-Control")).toBe("private, max-age=30");
    });
  });
});
