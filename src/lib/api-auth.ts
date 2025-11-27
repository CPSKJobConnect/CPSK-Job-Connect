import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { INTERNAL_JWT_AUDIENCE, INTERNAL_JWT_ISSUER, INTERNAL_JWT_TOKEN_TYPE } from "@/lib/securityConstants";
import { verify } from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";

export async function getApiSession(request?: NextRequest) {
  // Browser-based session
  const session = await getServerSession(authOptions);
  if (session) return session;

  // API testing via Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // Canonicalize: trim whitespace
      const token = authHeader.substring(7).trim();
      try {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error("NEXTAUTH_SECRET not configured");

        const decoded = verify(token, secret, {
          audience: INTERNAL_JWT_AUDIENCE,
          issuer: INTERNAL_JWT_ISSUER,
        }) as {
          sub: string;
          email: string;
          name: string;
          role: string;
          username: string;
          logoUrl?: string;
          backgroundUrl?: string;
          tokenVersion?: number;
          tokenType?: string;
        };

        if (decoded.tokenType !== INTERNAL_JWT_TOKEN_TYPE) {
          throw new Error("UNEXPECTED_TOKEN_TYPE");
        }

        // Validate token version against database to ensure revoked/terminated sessions are unusable
        const userId = parseInt(decoded.sub, 10);
        if (!Number.isNaN(userId)) {
          const account = await prisma.account.findUnique({
            where: { id: userId },
            select: { token_version: true, is_active: true },
          });
          const tokenVersion = decoded.tokenVersion ?? 0;
          if (!account || !account.is_active || account.token_version !== tokenVersion) {
            throw new Error("TOKEN_VERSION_MISMATCH");
          }
        }

        // Return session in the same format as NextAuth
        return {
          user: {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            username: decoded.username,
            logoUrl: decoded.logoUrl,
            backgroundUrl: decoded.backgroundUrl,
          },
          expires: "",
        };
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
  }

  return null;
}
