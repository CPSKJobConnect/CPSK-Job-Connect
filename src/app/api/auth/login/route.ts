import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting: Track failed login attempts per email/IP
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const loginAttemptsMap = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5; // Maximum 5 failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(identifier: string, timestamp: number) {
  const existing = loginAttemptsMap.get(identifier);
  if (existing) {
    existing.count += 1;
    existing.lastAttempt = timestamp;
  } else {
    loginAttemptsMap.set(identifier, {
      count: 1,
      firstAttempt: timestamp,
      lastAttempt: timestamp,
    });
  }
}

/**
 * POST /api/auth/login
 * Custom login endpoint for API testing (e.g., Postman)
 * Returns a JWT token that can be used for authenticated requests
 *
 * Rate Limiting: Max 5 failed attempts per 15 minutes per email/IP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get client identifier (email + IP for better security)
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const identifier = `${email.toLowerCase().trim()}:${clientIp}`;
    const now = Date.now();

    // Check rate limit
    const attemptRecord = loginAttemptsMap.get(identifier);
    if (attemptRecord) {
      // Reset if window has passed
      if (now - attemptRecord.firstAttempt > WINDOW_MS) {
        loginAttemptsMap.delete(identifier);
      } else if (attemptRecord.count >= MAX_ATTEMPTS) {
        // Check if still locked out
        const timeSinceLastAttempt = now - attemptRecord.lastAttempt;
        if (timeSinceLastAttempt < LOCKOUT_MS) {
          const remainingMinutes = Math.ceil((LOCKOUT_MS - timeSinceLastAttempt) / 60000);
          return NextResponse.json(
            {
              error: "Too many failed login attempts",
              message: `Account temporarily locked. Please try again in ${remainingMinutes} minute(s)`,
              remainingMinutes,
            },
            { status: 429 }
          );
        } else {
          // Lockout period expired, reset
          loginAttemptsMap.delete(identifier);
        }
      }
    }

    // Find user
    const user = await prisma.account.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        logoUrl: true,
        backgroundUrl: true,
        accountRole: {
          select: {
            name: true,
          },
        },
      },
    });

    // Check if user exists and has password
    if (!user || !user.password) {
      // Record failed attempt
      recordFailedAttempt(identifier, now);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Record failed attempt
      recordFailedAttempt(identifier, now);

      // Get updated attempt count to show in error message
      const updatedRecord = loginAttemptsMap.get(identifier);
      const attemptsRemaining = updatedRecord ? MAX_ATTEMPTS - updatedRecord.count : MAX_ATTEMPTS;

      return NextResponse.json(
        {
          error: "Invalid credentials",
          attemptsRemaining: Math.max(0, attemptsRemaining),
        },
        { status: 401 }
      );
    }

    // Successful login - clear any failed attempts
    loginAttemptsMap.delete(identifier);

    // Create JWT token (mimicking NextAuth session)
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const token = sign(
      {
        sub: user.id.toString(),
        email: user.email,
        name: user.username,
        role: user.accountRole?.name,
        username: user.username,
        logoUrl: user.logoUrl,
        backgroundUrl: user.backgroundUrl,
      },
      secret,
      {
        expiresIn: "2h", // Token expires in 2 hours (matches NextAuth session)
      }
    );

    // Return success response with token and user info
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          role: user.accountRole?.name,
          logoUrl: user.logoUrl,
          backgroundUrl: user.backgroundUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}