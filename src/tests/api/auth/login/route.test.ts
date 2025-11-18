import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

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
  sign: jest.fn(),
}));

const buildRequest = (body: any) =>
  new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/auth/login", () => {
  const user = {
    id: 1,
    email: "user@example.com",
    username: "User",
    password: "hashed",
    accountRole: { name: "student" },
    logoUrl: "logo.png",
    backgroundUrl: "bg.png",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "secret";
  });

  it("validates required payload", async () => {
    const res = await POST(buildRequest({ email: "a@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 for missing user", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(buildRequest({ email: "a", password: "b" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid password", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = await POST(buildRequest({ email: "user@example.com", password: "bad" }));
    expect(res.status).toBe(401);
  });

  it("returns 500 if secret missing", async () => {
    delete process.env.NEXTAUTH_SECRET;
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = await POST(buildRequest({ email: "user@example.com", password: "secret" }));
    expect(res.status).toBe(500);
  });

  it("returns JWT token on success", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (sign as jest.Mock).mockReturnValue("jwt-token");

    const res = await POST(buildRequest({ email: "user@example.com", password: "secret" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBe("jwt-token");
    expect(sign).toHaveBeenCalled();
  });

  it("handles unexpected errors", async () => {
    (prisma.account.findUnique as jest.Mock).mockRejectedValue(new Error("DB"));
    const res = await POST(buildRequest({ email: "user@example.com", password: "secret" }));
    expect(res.status).toBe(500);
  });
});
