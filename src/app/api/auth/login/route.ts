import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let email  = body;
    const password  = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Canonicalize email (1.1.1)
    email = email.trim().toLowerCase().normalize("NFC");

    // Find user
    const user = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        logoUrl: true,
        backgroundUrl: true,
        accountRole: { select: { name: true } },
      },
    });

    // Check if user exists and has password
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Create JWT token
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
      { expiresIn: "30d" }
    );

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
    if (process.env.NODE_ENV === "development") {
        console.error("Login error:", error);
    }
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 });
  }
}
