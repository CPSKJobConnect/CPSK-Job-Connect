/**
 * Tests for getApiSession helper
 */

import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { getServerSession } from "next-auth/next";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/db";
import {
  INTERNAL_JWT_AUDIENCE,
  INTERNAL_JWT_ISSUER,
  INTERNAL_JWT_TOKEN_TYPE,
} from "@/lib/securityConstants";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
  },
}));

describe("getApiSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXTAUTH_SECRET;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      tokenType: INTERNAL_JWT_TOKEN_TYPE,
      tokenVersion: 0,
    });
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({ token_version: 0, is_active: true });

    const request = new NextRequest("http://localhost/api/test", {
      headers: {
        authorization: "Bearer test-token",
      },
    });

    const session = await getApiSession(request);

    expect(verify).toHaveBeenCalledWith("test-token", "secret", {
      audience: INTERNAL_JWT_AUDIENCE,
      issuer: INTERNAL_JWT_ISSUER,
    });
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
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({ token_version: 0, is_active: true });
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const request = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer bad-token" },
    });

    const session = await getApiSession(request);

    expect(session).toBeNull();
  });

  it("rejects tokens with mismatched token types", async () => {
    process.env.NEXTAUTH_SECRET = "secret";
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (verify as jest.Mock).mockReturnValue({
      sub: "99",
      email: "token@example.com",
      name: "Token User",
      role: "student",
      username: "tokenuser",
      tokenType: "external",
    });

    const request = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer wrong-type" },
    });

    const session = await getApiSession(request);

    expect(session).toBeNull();
  });
});
