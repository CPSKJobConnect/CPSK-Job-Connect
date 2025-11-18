import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * API route to check if the current user's account is still active
 * This is called by the client to verify real-time account status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ active: false, error: "No session" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ active: false, error: "Invalid user ID" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: userId },
      select: { is_active: true }
    });

    if (!account) {
      return NextResponse.json({ active: false, error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ active: account.is_active }, { status: 200 });
  } catch (error) {
    console.error("Error checking account status:", error);
    return NextResponse.json({ active: false, error: "Server error" }, { status: 500 });
  }
}
