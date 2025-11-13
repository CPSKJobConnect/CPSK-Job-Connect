import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = Number(session.user.id);

  // Check if there are any notifications first (lightweight query)
  const hasNotifications = await prisma.notification.findFirst({
    where: { account_id: accountId },
    select: { id: true }
  });

  // If no notifications, return empty array immediately
  if (!hasNotifications) {
    const response = NextResponse.json([]);
    // Cache for 30 seconds
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  }

  const latestPerSender = await prisma.notification.findMany({
    where: { account_id: accountId },
    orderBy: { created_at: "desc" },
    distinct: ["sender_id"],
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          logoUrl: true,
          student: { select: { name: true } },
          company: { select: { name: true } }
        }
      }
    },
  });

  const data = latestPerSender.map((n) => {
    // Resolve sender name: prioritize username, then student name, then company name, finally "System"
    const senderName = n.sender?.username
      || n.sender?.student?.name
      || n.sender?.company?.name
      || "System";

    return {
      senderId: n.sender_id,
      senderName,
      senderLogo: n.sender?.logoUrl ?? null,
      message: n.message,
      is_read: n.is_read,
      created_at: n.created_at,
    };
  });

  const response = NextResponse.json(data);
  // Cache for 30 seconds to reduce database load
  response.headers.set('Cache-Control', 'private, max-age=30');
  return response;
}
