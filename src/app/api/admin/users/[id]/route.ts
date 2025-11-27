import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

// PATCH - Toggle user active/inactive status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAccount = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!adminAccount || adminAccount.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const data = await request.json();
    const isActive: boolean = !!data.isActive;

    // Prevent admin from modifying themselves
    if (userId === adminAccount.id) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    const user = await prisma.account.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.account.update({
      where: { id: userId },
      data: { is_active: isActive, updated_at: new Date() },
      select: {
        id: true,
        email: true,
        username: true,
        is_active: true,
        accountRole: { select: { name: true } }
      }
    });

    return NextResponse.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.username || updatedUser.email.split('@')[0],
        email: updatedUser.email,
        role: updatedUser.accountRole?.name?.toLowerCase() || "unknown",
        isActive: updatedUser.is_active
      }
    }, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAccount = await prisma.account.findUnique({
      where: { email: session.user.email },
      include: { accountRole: true }
    });

    if (!adminAccount || adminAccount.accountRole?.name?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (userId === adminAccount.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const user = await prisma.account.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.account.delete({ where: { id: userId } });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

  } catch (error) {
    logDebug("API error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
