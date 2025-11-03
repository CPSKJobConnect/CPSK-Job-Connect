import { authOptions } from "@/lib/auth";
import { verify } from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";

/**
 * Get session from either NextAuth cookies or Authorization header (for API testing)
 * This allows both browser-based authentication and Postman/API testing
 */
export async function getApiSession(request?: NextRequest) {
  // First, try to get session from NextAuth (normal browser flow)
  const session = await getServerSession(authOptions);
  if (session) {
    return session;
  }

  // If no session, try to get token from Authorization header (API testing)
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          throw new Error("NEXTAUTH_SECRET not configured");
        }

        const decoded = verify(token, secret) as {
          sub: string;
          email: string;
          name: string;
          role: string;
          username: string;
          logoUrl?: string;
          backgroundUrl?: string;
        };

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
          expires: "", // Not used for JWT-based sessions
        };
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
  }

  return null;
}