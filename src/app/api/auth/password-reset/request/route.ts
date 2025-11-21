import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;

const recentRequests = new Map<string, number>();

const genericSuccessMessage =
  "If an account exists for that email, we'll send reset instructions shortly.";

function getAppBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const now = Date.now();
    const lastRequest = recentRequests.get(email);
    if (lastRequest && now - lastRequest < RESET_REQUEST_COOLDOWN_MS) {
      return NextResponse.json({ message: genericSuccessMessage });
    }
    recentRequests.set(email, now);

    const account = await prisma.account.findUnique({
      where: { email },
      select: { id: true, username: true },
    });

    if (!account) {
      return NextResponse.json({ message: genericSuccessMessage });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: {
        account_id: account.id,
        email,
        token,
        expires_at: expiresAt,
      },
    });

    const resetLink = `${getAppBaseUrl()}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      email,
      name: account.username ?? undefined,
      resetLink,
      expiresMinutes: TOKEN_TTL_MS / 60000,
    });

    return NextResponse.json({ message: genericSuccessMessage });
  } catch (error) {
    console.error("Error handling password reset request:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request" },
      { status: 500 }
    );
  }
}
