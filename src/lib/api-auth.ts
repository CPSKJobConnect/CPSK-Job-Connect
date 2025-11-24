import { authOptions } from "@/lib/auth";
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

        const decoded = verify(token, secret) as {
          sub: string;
          email: string;
          name: string;
          role: string;
          username: string;
          logoUrl?: string;
          backgroundUrl?: string;
        };

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
        // OWASP ASVS 13.4.2: log detailed error only in development
        if (process.env.NODE_ENV === "development") {
          console.error("Invalid token:", error);
        } else {
          console.error("Invalid token.");
        }
        return null;
      }
    }
  }

  return null;
}
