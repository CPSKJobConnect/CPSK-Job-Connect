import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/login
 * Custom login endpoint for API testing (e.g., Postman)
 * Returns a JWT token that can be used for authenticated requests
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
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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
        expiresIn: "30d", // Token expires in 30 days
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