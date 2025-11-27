/**
 * Session Termination Tests for OWASP ASVS V7.4.1
 *
 * Tests:
 * - 7.4.1: Session termination enforcement
 * - Token version-based session invalidation
 * - Explicit session termination validation
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

describe("Session Termination Tests (OWASP ASVS V7.4.1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing";
    process.env.JWT_AUDIENCE = "cpsk-job-connect";
    process.env.JWT_ISSUER = "cpsk-job-connect-auth";
  });

  describe("7.4.1 - Explicit Session Termination on Logout", () => {
    it("should increment token_version when user signs out", async () => {
      const mockUpdate = prisma.account.update as jest.Mock;
      mockUpdate.mockResolvedValue({ id: 42, token_version: 6 });

      const events = authOptions.events!;
      const mockToken = {
        sub: "42",
        role: "student",
        tokenVersion: 5,
      } as any;

      // Trigger signOut event
      await events.signOut!({ token: mockToken });

      // Verify token_version was incremented
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { token_version: { increment: 1 } },
      });
    });

    it("should handle signOut for invalid user IDs gracefully", async () => {
      const mockUpdate = prisma.account.update as jest.Mock;

      const events = authOptions.events!;
      const mockToken = {
        sub: "not-a-number",
        role: "student",
      } as any;

      // Should not throw error
      await expect(events.signOut!({ token: mockToken })).resolves.not.toThrow();

      // Should not call update for invalid ID
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should handle signOut when token has no sub", async () => {
      const mockUpdate = prisma.account.update as jest.Mock;

      const events = authOptions.events!;
      const mockToken = {
        role: "student",
        // No sub field
      } as any;

      await expect(events.signOut!({ token: mockToken })).resolves.not.toThrow();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("7.4.1 - Token Version Mismatch Detection", () => {
    it("should reject tokens with outdated version (after logout)", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const oldToken = {
        sub: "42",
        role: "student",
        tokenVersion: 5, // Old version
        lastTokenVersionCheck: 0, // Force version check by setting to 0
      } as any;

      // Database has incremented version (user logged out)
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 6, // New version after logout
        is_active: true,
      });

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

    it("should accept tokens with current version", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const currentToken = {
        sub: "42",
        role: "student",
        tokenVersion: 7,
        lastActivity: Date.now() - 5000,
        lastTokenVersionCheck: Date.now() - 61000, // Force check
      } as any;

      // Database version matches
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 7,
        is_active: true,
      });

      const result = await callbacks.jwt!({
        token: currentToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Session should not be locked
      expect(resultMeta.sessionLocked).not.toBe(true);
    });

    it("should reject tokens after multiple logout cycles", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      // Token from original session
      const veryOldToken = {
        sub: "42",
        role: "student",
        tokenVersion: 2,
        lastTokenVersionCheck: 0, // Force check
      } as any;

      // User has logged out and back in multiple times
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 10, // Many versions ahead
        is_active: true,
      });

      const result = await callbacks.jwt!({
        token: veryOldToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;
      expect(resultMeta.sessionLocked).toBe(true);
    });
  });

  describe("7.4.1 - Token Version Check Timing", () => {
    it("should check token version periodically (every 60 seconds)", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const oldToken = {
        sub: "42",
        role: "student",
        tokenVersion: 5,
        lastTokenVersionCheck: Date.now() - 61000, // 61 seconds ago - triggers check
      } as any;

      // Database has incremented version
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 6,
        is_active: true,
      });

      const result = await callbacks.jwt!({
        token: oldToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Version check should have been performed and session locked
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: { token_version: true, is_active: true },
      });
      expect(resultMeta.sessionLocked).toBe(true);
    });

    it("should skip version check if last check was recent", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const recentToken = {
        sub: "42",
        role: "student",
        tokenVersion: 5,
        lastTokenVersionCheck: Date.now() - 30000, // 30 seconds ago - too recent
        lastActivity: Date.now() - 5000,
      } as any;

      const result = await callbacks.jwt!({
        token: recentToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      // Should not have called database (check skipped)
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect((result as any).sessionLocked).not.toBe(true);
    });

    it("should update lastTokenVersionCheck timestamp after check", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      const beforeCheck = Date.now();
      const oldToken = {
        sub: "42",
        role: "student",
        tokenVersion: 7,
        lastTokenVersionCheck: 0, // Never checked
        lastActivity: Date.now(),
      } as any;

      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 7,
        is_active: true,
      });

      const result = await callbacks.jwt!({
        token: oldToken,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      const resultMeta = result as any;

      // Check should have been performed
      expect(mockFindUnique).toHaveBeenCalled();
      expect(resultMeta.lastTokenVersionCheck).toBeGreaterThanOrEqual(beforeCheck);
    });
  });

  describe("7.4.1 - Session Lifecycle Management", () => {
    it("should track token versions across login/logout cycles", async () => {
      const mockUpdate = prisma.account.update as jest.Mock;
      const events = authOptions.events!;

      // Simulate multiple logout cycles
      for (let version = 0; version < 5; version++) {
        mockUpdate.mockResolvedValue({ id: 42, token_version: version + 1 });

        await events.signOut!({
          token: { sub: "42", tokenVersion: version } as any,
        });

        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: 42 },
          data: { token_version: { increment: 1 } },
        });
      }

      // Should have called update 5 times
      expect(mockUpdate).toHaveBeenCalledTimes(5);
    });

    it("should ensure old sessions cannot be reused after logout", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;
      const mockUpdate = prisma.account.update as jest.Mock;

      // Initial session with version 0
      const sessionV0 = {
        sub: "42",
        role: "student",
        tokenVersion: 0,
        lastActivity: Date.now(),
        lastTokenVersionCheck: Date.now() - 61000, // Force check
      } as any;

      // Database initially at version 0
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 0,
        is_active: true,
      });

      // First request succeeds
      let result = await callbacks.jwt!({
        token: sessionV0,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      expect((result as any).sessionLocked).not.toBe(true);

      // User logs out (version increments to 1)
      mockUpdate.mockResolvedValue({ id: 42, token_version: 1 });
      const events = authOptions.events!;
      await events.signOut!({ token: sessionV0 });

      // Update database to reflect new version
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 1,
        is_active: true,
      });

      // Try to use old session V0 - should fail
      // Reset lastTokenVersionCheck to force another check
      sessionV0.lastTokenVersionCheck = 0;
      result = await callbacks.jwt!({
        token: sessionV0,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      expect((result as any).sessionLocked).toBe(true);
    });
  });

  describe("7.4.1 - Concurrent Session Termination", () => {
    it("should invalidate all active sessions when token version changes", async () => {
      const callbacks = authOptions.callbacks!;
      const mockFindUnique = prisma.account.findUnique as jest.Mock;

      // Simulate 3 concurrent sessions with same version
      const session1 = { sub: "42", tokenVersion: 10, lastActivity: Date.now(), lastTokenVersionCheck: Date.now() - 61000 } as any;
      const session2 = { sub: "42", tokenVersion: 10, lastActivity: Date.now(), lastTokenVersionCheck: Date.now() - 61000 } as any;
      const session3 = { sub: "42", tokenVersion: 10, lastActivity: Date.now(), lastTokenVersionCheck: Date.now() - 61000 } as any;

      // Initially all sessions are valid
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 10,
        is_active: true,
      });

      let result1 = await callbacks.jwt!({
        token: session1,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      expect((result1 as any).sessionLocked).not.toBe(true);

      // User logs out from one device (version becomes 11)
      mockFindUnique.mockResolvedValue({
        id: 42,
        token_version: 11,
        is_active: true,
      });

      // Force all sessions to check version (reset lastTokenVersionCheck)
      session1.lastTokenVersionCheck = 0;
      session2.lastTokenVersionCheck = 0;
      session3.lastTokenVersionCheck = 0;

      // All old sessions should be invalidated
      result1 = await callbacks.jwt!({
        token: session1,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      const result2 = await callbacks.jwt!({
        token: session2,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      const result3 = await callbacks.jwt!({
        token: session3,
        user: undefined,
        account: null,
        trigger: undefined,
        session: undefined,
      });

      expect((result1 as any).sessionLocked).toBe(true);
      expect((result2 as any).sessionLocked).toBe(true);
      expect((result3 as any).sessionLocked).toBe(true);
    });
  });
});
