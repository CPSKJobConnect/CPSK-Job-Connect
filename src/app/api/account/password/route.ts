import { getApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { PasswordPolicyError } from "@/lib/passwordPolicy";
import { assertPasswordMeetsPolicy } from "@/lib/passwordPolicyEnforcer";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: Number(session.user.id) },
      select: { id: true, password: true, email: true, username: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const hasExistingPassword = Boolean(account.password);

    if (hasExistingPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const matches = await bcrypt.compare(currentPassword, account.password!);
      if (!matches) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
      }

      const isSameAsCurrent = await bcrypt.compare(newPassword, account.password!);
      if (isSameAsCurrent) {
        return NextResponse.json({ error: "New password must be different from the current password" }, { status: 400 });
      }
    }

    assertPasswordMeetsPolicy(newPassword, {
      email: account.email,
      username: account.username ?? undefined,
    });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: hasExistingPassword ? "Password updated successfully" : "Password set successfully",
    });
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update password:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
