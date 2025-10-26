import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// PATCH - Toggle user active/inactive status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    console.log("🔍 User role:", userRole);

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = parseInt(params.id);
    const { isActive } = await request.json();

    // Prevent admin from deactivating themselves
    if (userId === userRole.id) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.account.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user status
    // Since there's no isActive field in the schema, I'll use emailVerified as a proxy
    const updatedUser = await prisma.account.update({
      where: { id: userId },
      data: {
        emailVerified: isActive ? new Date() : null
      },
      include: {
        accountRole: true,
        student: {
          select: {
            id: true,
            student_id: true,
            name: true,
            faculty: true,
            year: true,
            phone: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            description: true,
            website: true,
            registration_status: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.username || updatedUser.email.split('@')[0],
        email: updatedUser.email,
        role: updatedUser.accountRole?.name?.toLowerCase() || "unknown",
        isActive: !!updatedUser.emailVerified
      }
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (using session role)
    const userRole = (session.user as any).role?.toLowerCase();
    console.log("🔍 User role:", userRole);

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = parseInt(params.id);

    // Prevent admin from deleting themselves
    if (userId === userRole.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.account.findUnique({
      where: { id: userId },
      include: { accountRole: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user account (this will cascade delete related records due to onDelete: Cascade)
    await prisma.account.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: "User deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
