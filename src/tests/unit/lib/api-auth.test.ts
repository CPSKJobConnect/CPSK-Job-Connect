/**
 * Tests for getApiSession helper
 */

import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { getServerSession } from "next-auth/next";
import { verify } from "jsonwebtoken";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("getApiSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXTAUTH_SECRET;
  });

  it("returns NextAuth session when available", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "1", email: "user@example.com" },
    });

    const session = await getApiSession();

    expect(session?.user.email).toBe("user@example.com");
    expect(getServerSession).toHaveBeenCalled();
  });

  it("parses Bearer token when NextAuth session missing", async () => {
    process.env.NEXTAUTH_SECRET = "secret";
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (verify as jest.Mock).mockReturnValue({
      sub: "42",
      email: "token@example.com",
      name: "Token User",
      role: "student",
      username: "tokenuser",
      logoUrl: "logo.png",
    });

    const request = new NextRequest("http://localhost/api/test", {
      headers: {
        authorization: "Bearer test-token",
      },
    });

    const session = await getApiSession(request);

    expect(verify).toHaveBeenCalledWith("test-token", "secret");
    expect(session?.user).toMatchObject({
      id: "42",
      email: "token@example.com",
      role: "student",
      username: "tokenuser",
      logoUrl: "logo.png",
    });
  });

  it("returns null when Authorization header missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/test");

    const session = await getApiSession(request);

    expect(session).toBeNull();
  });

  it("returns null when token verification fails", async () => {
    process.env.NEXTAUTH_SECRET = "secret";
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const request = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer bad-token" },
    });

    const session = await getApiSession(request);

    expect(session).toBeNull();
  });
});
