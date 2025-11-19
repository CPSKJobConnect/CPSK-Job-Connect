import { POST } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
}));

// Helper to create mock request
function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
    },
  } as unknown as NextRequest;
  return request;
}

describe("POST /api/auth/login", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    username: "testuser",
    password: "$2a$12$hashedpassword",
    role: 1,
    logoUrl: null,
    backgroundUrl: null,
    accountRole: {
      name: "student",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  describe("Input Validation", () => {
    it("should return 400 if email is missing", async () => {
      const request = createMockRequest({ password: "password123" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 400 if password is missing", async () => {
      const request = createMockRequest({ email: "test@example.com" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 400 if both email and password are missing", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and password are required");
    });
  });

  describe("Authentication", () => {
    it("should return 401 if user does not exist", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        email: "nonexistent@example.com",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return 401 if user has no password (OAuth account)", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: null,
      });

      const request = createMockRequest({
        email: "oauth@example.com",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return 401 if password is invalid", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const request = createMockRequest({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
      expect(data.attemptsRemaining).toBe(4); // First failed attempt
    });

    it("should return 200 and JWT token on successful login", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "test@example.com",
        password: "correctpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe("mock-jwt-token");
      expect(data.user).toMatchObject({
        id: "1",
        email: "test@example.com",
        username: "testuser",
        role: "student",
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should track failed login attempts", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const request1 = createMockRequest(
        { email: "test@example.com", password: "wrong1" },
        { "x-forwarded-for": "192.168.1.1" }
      );

      const response1 = await POST(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(401);
      expect(data1.attemptsRemaining).toBe(4);

      const request2 = createMockRequest(
        { email: "test@example.com", password: "wrong2" },
        { "x-forwarded-for": "192.168.1.1" }
      );

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(401);
      expect(data2.attemptsRemaining).toBe(3);
    });

    it("should lock account after 5 failed attempts", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const clientIp = "192.168.1.100";
      const email = "locked@example.com";

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest(
          { email, password: `wrong${i}` },
          { "x-forwarded-for": clientIp }
        );
        await POST(request);
      }

      // 6th attempt should be locked
      const lockedRequest = createMockRequest(
        { email, password: "wrong6" },
        { "x-forwarded-for": clientIp }
      );

      const response = await POST(lockedRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many failed login attempts");
      expect(data.message).toContain("Account temporarily locked");
      expect(data.remainingMinutes).toBeGreaterThan(0);
    });

    it("should reset attempts on successful login", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const clientIp = "192.168.1.200";
      const email = "reset@example.com";

      // Make 3 failed attempts
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(
          { email, password: `wrong${i}` },
          { "x-forwarded-for": clientIp }
        );
        await POST(request);
      }

      // Successful login should reset counter
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const successRequest = createMockRequest(
        { email, password: "correct" },
        { "x-forwarded-for": clientIp }
      );
      const successResponse = await POST(successRequest);

      expect(successResponse.status).toBe(200);

      // Next failed attempt should start from 0 again
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const nextRequest = createMockRequest(
        { email, password: "wrong" },
        { "x-forwarded-for": clientIp }
      );
      const nextResponse = await POST(nextRequest);
      const nextData = await nextResponse.json();

      expect(nextData.attemptsRemaining).toBe(4); // Reset, first attempt again
    });

    it("should track attempts per email+IP combination", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const email = "test@example.com";

      // 3 failed attempts from IP1
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(
          { email, password: "wrong" },
          { "x-forwarded-for": "192.168.1.1" }
        );
        await POST(request);
      }

      // Attempt from different IP should have separate counter
      const differentIpRequest = createMockRequest(
        { email, password: "wrong" },
        { "x-forwarded-for": "192.168.1.2" }
      );
      const response = await POST(differentIpRequest);
      const data = await response.json();

      expect(data.attemptsRemaining).toBe(4); // First attempt from this IP
    });

    it("should use unknown IP if headers are missing", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const request = createMockRequest({
        email: "test@example.com",
        password: "wrong",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.attemptsRemaining).toBeDefined();
    });
  });

  describe("JWT Token Generation", () => {
    it("should return 500 if NEXTAUTH_SECRET is not configured", async () => {
      delete process.env.NEXTAUTH_SECRET;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "test@example.com",
        password: "correctpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Server configuration error");

      // Restore for other tests
      process.env.NEXTAUTH_SECRET = "test-secret";
    });

    it("should include all user fields in token payload", async () => {
      const jwt = require("jsonwebtoken");
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "test@example.com",
        password: "correctpassword",
      });

      await POST(request);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "1",
          email: "test@example.com",
          name: "testuser",
          role: "student",
          username: "testuser",
        }),
        "test-secret",
        expect.objectContaining({
          expiresIn: "2h",
        })
      );
    });

    it("should set JWT expiration to 2 hours", async () => {
      const jwt = require("jsonwebtoken");
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "test@example.com",
        password: "correctpassword",
      });

      await POST(request);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: "2h" }
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on database error", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createMockRequest({
        email: "test@example.com",
        password: "password",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("An error occurred during login");
    });

    it("should return 500 on bcrypt error", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error("Bcrypt error")
      );

      const request = createMockRequest({
        email: "test@example.com",
        password: "password",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("An error occurred during login");
    });
  });
});
