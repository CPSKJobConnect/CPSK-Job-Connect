import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { PasswordPolicyError } from "@/lib/passwordPolicy";
import { assertPasswordMeetsPolicy } from "@/lib/passwordPolicyEnforcer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (
      !resetRecord ||
      resetRecord.used_at ||
      resetRecord.expires_at < new Date() ||
      !resetRecord.account
    ) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    assertPasswordMeetsPolicy(password, {
      email: resetRecord.account.email,
      username: resetRecord.account.username ?? undefined,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.account.update({
      where: { id: resetRecord.account_id },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used_at: new Date() },
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        account_id: resetRecord.account_id,
        NOT: { id: resetRecord.id },
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error completing password reset:", error);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}
