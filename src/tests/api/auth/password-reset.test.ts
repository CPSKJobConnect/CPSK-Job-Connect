/**
 * Tests for password reset API flow
 *
 * Endpoints:
 * - POST /api/auth/password-reset/request
 * - POST /api/auth/password-reset/complete
 */

import { POST as requestReset } from "@/app/api/auth/password-reset/request/route";
import { POST as completeReset } from "@/app/api/auth/password-reset/complete/route";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { createPrismaMock, resetAllMocks, silenceConsole } from "@/tests/setup/mocks";

jest.mock("@/lib/db", () => {
  const { createPrismaMock } = require("@/tests/setup/mocks");
  return {
    prisma: createPrismaMock(),
  };
});

jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts?: { status?: number }) => ({
      status: opts?.status || 200,
      body,
      json: async () => body,
    }),
  },
  NextRequest: jest.requireActual("next/server").NextRequest,
}));

silenceConsole();

describe("Password reset request API", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const req = new Request("http://localhost/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await requestReset(req as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Email is required");
  });

  it("always returns success even if account is not found", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email: "missing@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await requestReset(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/If an account exists/i);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends an email for valid accounts", async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      username: "Student",
    });
    const req = new Request("http://localhost/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email: "student@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await requestReset(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/we'll send reset instructions/i);
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "student@example.com",
      })
    );
  });
});

describe("Password reset completion API", () => {
  const baseTokenRecord = {
    id: 1,
    account_id: 42,
    email: "student@example.com",
    token: "valid-token",
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    used_at: null,
    account: {
      id: 42,
      email: "student@example.com",
      username: "Student",
    },
  };

  beforeEach(() => {
    resetAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
  });

  it("returns 400 when token or password missing", async () => {
    const req = new Request("http://localhost/api/auth/password-reset/complete", {
      method: "POST",
      body: JSON.stringify({ token: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeReset(req as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Token and new password/i);
  });

  it("rejects invalid or expired tokens", async () => {
    (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost/api/auth/password-reset/complete", {
      method: "POST",
      body: JSON.stringify({ token: "bad", password: "ValidPass123!" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeReset(req as any);
    expect(res.status).toBe(400);

    (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
      ...baseTokenRecord,
      expires_at: new Date(Date.now() - 1000),
    });

    const expiredRes = await completeReset(req as any);
    expect(expiredRes.status).toBe(400);
  });

  it("updates password and invalidates token", async () => {
    (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(baseTokenRecord);

    const req = new Request("http://localhost/api/auth/password-reset/complete", {
      method: "POST",
      body: JSON.stringify({ token: "valid-token", password: "NewStrongPass!123" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await completeReset(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/Password updated/);
    expect(bcrypt.hash).toHaveBeenCalledWith("NewStrongPass!123", 12);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: baseTokenRecord.account_id },
      data: { password: "hashed-password" },
    });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: baseTokenRecord.id },
      data: { used_at: expect.any(Date) },
    });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: {
        account_id: baseTokenRecord.account_id,
        NOT: { id: baseTokenRecord.id },
      },
    });
  });
});
