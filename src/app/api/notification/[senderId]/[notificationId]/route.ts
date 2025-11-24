import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ senderId: string; notificationId: string }> }
) {
  const { notificationId } = await params;
  const session = await getApiSession(req);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Canonicalize and validate notificationId (ASVS 1.1.1)
  const decodedNotifId = decodeURIComponent(notificationId);
  const notifId = Number(decodedNotifId);

  if (isNaN(notifId)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const accountId = Number(session.user.id);

  try {
    // Update only if the notification belongs to the current user
    const updated = await prisma.notification.updateMany({
      where: {
        id: notifId,
        account_id: accountId,
      },
      data: { is_read: true },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Notification not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error marking notification as read:", error);
    }
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
