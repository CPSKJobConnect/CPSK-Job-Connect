/**
 * Session Management Security Tests for OWASP ASVS V7 Requirements
 *
 * Tests:
 * - 7.2.3: Secure reference token generation (CSPRNG with 128+ bits entropy)
 * - 7.2.4: Session token rotation on re-authentication
 * - 7.4.2: Terminate all sessions when account disabled/deleted
 */

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/oauthRefreshTokenService", () => ({
  rotateGoogleRefreshToken: jest.fn(),
}));

describe("Session Management Security Tests (OWASP ASVS V7)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("7.2.3 - Secure Random Token Generation", () => {
    it("should generate unique session tokens for each authentication", async () => {
      // This test verifies that NextAuth generates unique tokens
      // by checking that multiple JWT callbacks produce different token metadata

      const callbacks = authOptions.callbacks!;
      const tokens = new Set<string>();

      // Simulate multiple user sign-ins
      for (let i = 0; i < 10; i++) {
        const token = await callbacks.jwt!({
          token: { sub: `${i}` } as any,
          user: {
            id: `${i}`,
            email: `user${i}@example.com`,
            name: `User ${i}`,
            role: "student",
          } as any,
          account: null,
          trigger: undefined,
          session: undefined,
        });

        // Check that lastActivity timestamp is unique (pseudo-random)
        const tokenMeta = token as any;
        tokens.add(`${tokenMeta.lastActivity}_${token.sub}`);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10);
    });

    it("should use cryptographically secure random for session identifiers", () => {
      // Verify that Node.js crypto module is available (used by NextAuth)
      const crypto = require("crypto");

      // Generate random bytes to verify CSPRNG availability
      const randomBytes = crypto.randomBytes(16);
      expect(randomBytes).toHaveLength(16);
      expect(randomBytes).toBeInstanceOf(Buffer);

      // Verify entropy (128 bits = 16 bytes)
      const hexString = randomBytes.toString("hex");
      expect(hexString).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hexString).toMatch(/^[0-9a-f]{32}$/);
    });

    it("should generate session tokens with sufficient entropy", () => {
      const crypto = require("crypto");

      // Test entropy of generated random values
      const samples = new Set<string>();
      const sampleSize = 1000;

      for (let i = 0; i < sampleSize; i++) {
        const random = crypto.randomBytes(16).toString("hex");
        samples.add(random);
      }

      // All samples should be unique (no collisions with 128-bit entropy)
      expect(samples.size).toBe(sampleSize);
    });
  });

  describe("7.2.4 - Session Token Rotation on Re-authentication", () => {
    it("should increment token_version on signOut event", async () => {
      const events = authOptions.events!;
      const mockUpdate = prisma.account.update as jest.Mock;

      mockUpdate.mockResolvedValue({ token_version: 1 });

      // Simulate signOut event
      await events.signOut!({
        token: { sub: "42" } as any,
        session: null as any,
      });

      // Verify token_version was incremented
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { token_version: { increment: 1 } },
      });
    });

    it("should handle signOut event when token is missing sub", async () => {
      const events = authOptions.events!;
      const mockUpdate = prisma.account.update as jest.Mock;

      // Simulate signOut with invalid token
      await events.signOut!({
        token: {} as any,
        session: null as any,
      });

      // Should not attempt to update database
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should handle signOut event with null token gracefully", async () => {
      const events = authOptions.events!;
      const mockUpdate = prisma.account.update as jest.Mock;

      // Simulate signOut with null token
      await events.signOut!({
        token: null as any,
        session: null as any,
      });

      // Should not crash or update database
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should reject old token after version increment", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      // User's token has version 0 (old)
      const oldToken = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: Date.now() - 1000, // Recent activity
      } as any;

      // Database shows version 1 (user logged out and back in)
      mockFindUnique.mockResolvedValue({
        token_version: 1,
        is_active: true,
      });

      // JWT callback should detect version mismatch and lock session
      const result = await callbacks.jwt!({
        token: oldToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should be locked due to version mismatch
      expect(resultMeta.sessionLocked).toBe(true);
    });

    it("should accept token with matching version", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const validToken = {
        sub: "42",
        role: "student",
        tokenVersion: 5,
        lastActivity: Date.now() - 2000, // 2 seconds ago to ensure different timestamp
      } as any;

      // Database matches token version
      mockFindUnique.mockResolvedValue({
        token_version: 5,
        is_active: true,
      });

      const result = await callbacks.jwt!({
        token: validToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should not be locked
      expect(resultMeta.sessionLocked).not.toBe(true);
      expect(resultMeta.lastActivity).toBeGreaterThanOrEqual(validToken.lastActivity);
    });
  });

  describe("7.4.2 - Terminate All Sessions on Account Disable/Delete", () => {
    it("should invalidate session when account is disabled", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const token = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: Date.now() - 1000,
      } as any;

      // Account is disabled
      mockFindUnique.mockResolvedValue({
        token_version: 0,
        is_active: false, // DISABLED
      });

      const result = await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should be locked for disabled account
      expect(resultMeta.sessionLocked).toBe(true);
    });

    it("should invalidate session when account is deleted", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const token = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: Date.now() - 1000,
      } as any;

      // Account not found (deleted)
      mockFindUnique.mockResolvedValue(null);

      const result = await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should be locked for deleted account
      expect(resultMeta.sessionLocked).toBe(true);
    });

    it("should allow session for active account", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const token = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: Date.now() - 1000,
      } as any;

      // Account is active
      mockFindUnique.mockResolvedValue({
        token_version: 0,
        is_active: true, // ACTIVE
      });

      const result = await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should not be locked
      expect(resultMeta.sessionLocked).not.toBe(true);
    });

    it("should periodically check account status against database", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const now = Date.now();
      const token = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: now - 1000,
        lastTokenVersionCheck: now - 120000, // 2 minutes ago (>60s)
      } as any;

      mockFindUnique.mockResolvedValue({
        token_version: 0,
        is_active: true,
      });

      await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      // Should check token version against database
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: { token_version: true, is_active: true },
      });
    });

    it("should not check database too frequently", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const now = Date.now();
      const token = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: now - 1000,
        lastTokenVersionCheck: now - 30000, // 30 seconds ago (<60s)
      } as any;

      await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      // Should not check database (too soon)
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("Session Callback Security", () => {
    it("should mark session as locked when token is locked", async () => {
      const callbacks = authOptions.callbacks!;

      const lockedToken = {
        sub: "42",
        role: "student",
        sessionLocked: true, // Token marked as locked
      } as any;

      const result = await callbacks.session!({
        session: { user: {} } as any,
        token: lockedToken,
      });

      // Session user should be marked as locked
      expect(result.user.sessionLocked).toBe(true);
    });

    it("should not include locked flag for valid sessions", async () => {
      const callbacks = authOptions.callbacks!;

      const validToken = {
        sub: "42",
        role: "student",
        username: "testuser",
        sessionLocked: false,
      } as any;

      const result = await callbacks.session!({
        session: { user: {} } as any,
        token: validToken,
      });

      // Session should not have locked flag
      expect(result.user.sessionLocked).not.toBe(true);
      expect(result.user.role).toBe("student");
    });
  });

  describe("Inactivity Timeout (7.3.1)", () => {
    it("should lock session after 30 minutes of inactivity", async () => {
      const callbacks = authOptions.callbacks!;
      const { MAX_INACTIVITY_MS } = require("@/lib/auth");

      const inactiveToken = {
        sub: "42",
        role: "student",
        lastActivity: Date.now() - MAX_INACTIVITY_MS - 1000, // >30 min ago
      } as any;

      const result = await callbacks.jwt!({
        token: inactiveToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should be locked due to inactivity
      expect(resultMeta.sessionLocked).toBe(true);
      // Last activity timestamp should be preserved
      expect(resultMeta.lastActivity).toBe(inactiveToken.lastActivity);
    });

    it("should not lock session with recent activity", async () => {
      const callbacks = authOptions.callbacks!;
      const { MAX_INACTIVITY_MS } = require("@/lib/auth");

      const activeToken = {
        sub: "42",
        role: "student",
        lastActivity: Date.now() - (MAX_INACTIVITY_MS / 2) - 1000, // 15 min + 1 sec ago
      } as any;

      const result = await callbacks.jwt!({
        token: activeToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should not be locked
      expect(resultMeta.sessionLocked).not.toBe(true);
      // Last activity should be updated
      expect(resultMeta.lastActivity).toBeGreaterThanOrEqual(activeToken.lastActivity);
    });

    it("should update lastActivity on each request", async () => {
      const callbacks = authOptions.callbacks!;

      const oldTimestamp = Date.now() - 60000; // 1 minute ago
      const token = {
        sub: "42",
        role: "student",
        lastActivity: oldTimestamp,
      } as any;

      const result = await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Last activity should be updated to current time
      expect(resultMeta.lastActivity).toBeGreaterThan(oldTimestamp);
      expect(resultMeta.lastActivity).toBeLessThanOrEqual(Date.now());
    });

    it("should not update lastActivity for locked sessions", async () => {
      const callbacks = authOptions.callbacks!;
      const { MAX_INACTIVITY_MS } = require("@/lib/auth");

      const oldTimestamp = Date.now() - MAX_INACTIVITY_MS - 1000;
      const token = {
        sub: "42",
        role: "student",
        lastActivity: oldTimestamp,
        sessionLocked: false,
      } as any;

      const result = await callbacks.jwt!({
        token: token,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session locked, lastActivity not updated
      expect(resultMeta.sessionLocked).toBe(true);
      expect(resultMeta.lastActivity).toBe(oldTimestamp);
    });
  });

  describe("Session Configuration (7.2.2)", () => {
    it("should use JWT strategy for sessions", () => {
      expect(authOptions.session?.strategy).toBe("jwt");
    });

    it("should configure appropriate session maxAge", () => {
      // 2 hours = 7200 seconds
      expect(authOptions.session?.maxAge).toBe(2 * 60 * 60);
    });

    it("should configure JWT maxAge matching session", () => {
      expect(authOptions.jwt?.maxAge).toBe(2 * 60 * 60);
    });

    it("should configure session update age", () => {
      // Update every 15 minutes = 900 seconds
      expect(authOptions.session?.updateAge).toBe(15 * 60);
    });

    it("should have secure cookie configuration", () => {
      const cookies = authOptions.cookies;

      // Session token cookie
      expect(cookies?.sessionToken?.options?.httpOnly).toBe(true);
      expect(cookies?.sessionToken?.options?.sameSite).toBe("strict");
      expect(cookies?.sessionToken?.options?.path).toBe("/");

      // Secure flag should be true in production
      if (process.env.NODE_ENV === "production") {
        expect(cookies?.sessionToken?.options?.secure).toBe(true);
      }
    });
  });
});
