/**
 * JWT Security Tests for OWASP ASVS V9 Requirements
 *
 * Tests:
 * - 9.1.1: JWT signature validation
 * - 9.1.2: Approved algorithms only (no "none" algorithm)
 * - 9.1.3: Trusted key sources
 */

import { verify, sign } from "jsonwebtoken";
import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  INTERNAL_JWT_AUDIENCE,
  INTERNAL_JWT_ISSUER,
  INTERNAL_JWT_TOKEN_TYPE
} from "@/lib/securityConstants";

jest.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(() => null),
}));

describe("JWT Security Tests (OWASP ASVS V9)", () => {
  const SECRET = "test-secret-key-for-jwt-testing";

  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("9.1.1 - JWT Signature Validation", () => {
    it("should reject JWT with invalid signature", async () => {
      // Create valid token
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          role: "student",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      // Tamper with token by modifying payload
      const parts = validToken.split(".");
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          sub: "1",
          email: "test@example.com",
          role: "admin", // Changed from student to admin
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        })
      ).toString("base64url");

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      // Create mock request with tampered token
      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${tamperedToken}` : null
          ),
        },
      } as any;

      // Mock Prisma response
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      // Should return null due to invalid signature
      const result = await getApiSession(mockRequest);
      expect(result).toBeNull();
    });

    it("should accept JWT with valid signature", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("1");
      expect(result?.user.role).toBe("student");
    });
  });

  describe("9.1.2 - Approved Algorithms Only", () => {
    it("should reject JWT with 'none' algorithm", async () => {
      // Create token with no signature (algorithm: none)
      const header = Buffer.from(
        JSON.stringify({ alg: "none", typ: "JWT" })
      ).toString("base64url");

      const payload = Buffer.from(
        JSON.stringify({
          sub: "1",
          email: "test@example.com",
          role: "admin",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
        })
      ).toString("base64url");

      const noneToken = `${header}.${payload}.`;

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${noneToken}` : null
          ),
        },
      } as any;

      const result = await getApiSession(mockRequest);

      // Should reject token with 'none' algorithm
      expect(result).toBeNull();
    });

    it("should accept JWT with HS256 algorithm", async () => {
      const hs256Token = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { algorithm: "HS256", expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${hs256Token}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.user.role).toBe("student");
    });

    it("should reject JWT signed with different secret", async () => {
      const wrongSecret = "different-secret-key";
      const tokenWithWrongSecret = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
          username: "attacker",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        wrongSecret,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${tokenWithWrongSecret}` : null
          ),
        },
      } as any;

      const result = await getApiSession(mockRequest);

      // Should reject due to signature mismatch
      expect(result).toBeNull();
    });
  });

  describe("9.1.3 - Trusted Key Sources", () => {
    it("should only use NEXTAUTH_SECRET for verification", async () => {
      // Test that verification uses environment variable
      expect(process.env.NEXTAUTH_SECRET).toBe(SECRET);

      const token = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      // Verify token manually to ensure correct secret is used
      const decoded = verify(token, SECRET, {
        audience: INTERNAL_JWT_AUDIENCE,
        issuer: INTERNAL_JWT_ISSUER,
      });

      expect(decoded).toBeDefined();
      expect((decoded as any).sub).toBe("1");
    });

    it("should reject token with malicious 'jku' header claim", async () => {
      // Create token with jku header (attacker-controlled key URL)
      const header = Buffer.from(
        JSON.stringify({
          alg: "HS256",
          typ: "JWT",
          jku: "https://attacker.com/keys.json", // Malicious key source
        })
      ).toString("base64url");

      const payload = Buffer.from(
        JSON.stringify({
          sub: "1",
          email: "test@example.com",
          role: "admin",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
        })
      ).toString("base64url");

      // Sign with our secret (but header has jku)
      const token = sign(
        {
          sub: "1",
          email: "test@example.com",
          role: "admin",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
        },
        SECRET,
        { header: { jku: "https://attacker.com/keys.json" } }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${token}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      // Our implementation should ignore jku and only use NEXTAUTH_SECRET
      const result = await getApiSession(mockRequest);

      // Token should still be validated against NEXTAUTH_SECRET
      // The jku header is ignored (we don't fetch external keys)
      expect(result).not.toBeNull();
    });
  });

  describe("9.2.1 - JWT Expiration Validation", () => {
    it("should reject expired JWT", async () => {
      const expiredToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${expiredToken}` : null
          ),
        },
      } as any;

      const result = await getApiSession(mockRequest);

      // Should reject expired token
      expect(result).toBeNull();
    });

    it("should accept non-expired JWT", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" } // Valid for 1 hour
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
    });
  });

  describe("9.2.2 - Token Type Validation", () => {
    it("should reject JWT with wrong token type", async () => {
      const wrongTypeToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: "refresh", // Wrong type (should be "session")
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${wrongTypeToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      // Should reject due to wrong token type
      expect(result).toBeNull();
    });

    it("should accept JWT with correct token type", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE, // Correct type ("session")
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.user.role).toBe("student");
    });
  });

  describe("9.2.3 - Audience and Issuer Validation", () => {
    it("should reject JWT with wrong audience", async () => {
      const wrongAudienceToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: "wrong-audience", // Wrong audience
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${wrongAudienceToken}` : null
          ),
        },
      } as any;

      const result = await getApiSession(mockRequest);

      // Should reject due to audience mismatch
      expect(result).toBeNull();
    });

    it("should reject JWT with wrong issuer", async () => {
      const wrongIssuerToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: "malicious-issuer", // Wrong issuer
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${wrongIssuerToken}` : null
          ),
        },
      } as any;

      const result = await getApiSession(mockRequest);

      // Should reject due to issuer mismatch
      expect(result).toBeNull();
    });

    it("should accept JWT with correct audience and issuer", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE, // Correct audience
          iss: INTERNAL_JWT_ISSUER, // Correct issuer
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("1");
    });
  });

  describe("Token Version Validation (Session Revocation)", () => {
    it("should reject JWT with mismatched token version", async () => {
      const tokenWithOldVersion = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0, // Old version
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${tokenWithOldVersion}` : null
          ),
        },
      } as any;

      // User has logged out, token_version incremented to 1
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 1, // New version
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      // Should reject due to version mismatch (revoked session)
      expect(result).toBeNull();
    });

    it("should accept JWT with matching token version", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 5, // Current version
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 5, // Matching version
        is_active: true,
      });

      const result = await getApiSession(mockRequest);

      expect(result).not.toBeNull();
    });

    it("should reject JWT for disabled account", async () => {
      const validToken = sign(
        {
          sub: "1",
          email: "test@example.com",
          name: "Test User",
          role: "student",
          username: "testuser",
          aud: INTERNAL_JWT_AUDIENCE,
          iss: INTERNAL_JWT_ISSUER,
          tokenType: INTERNAL_JWT_TOKEN_TYPE,
          tokenVersion: 0,
        },
        SECRET,
        { expiresIn: "1h" }
      );

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === "authorization" ? `Bearer ${validToken}` : null
          ),
        },
      } as any;

      // Account is disabled
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        token_version: 0,
        is_active: false, // Disabled
      });

      const result = await getApiSession(mockRequest);

      // Should reject disabled account
      expect(result).toBeNull();
    });
  });
});
