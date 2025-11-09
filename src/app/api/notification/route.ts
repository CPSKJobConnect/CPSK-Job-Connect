import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = Number(session.user.id);

  const latestPerSender = await prisma.notification.findMany({
    where: { account_id: accountId },
    orderBy: { created_at: "desc" },
    distinct: ["sender_id"],
    include: { sender: { select: { id: true, username: true, logoUrl: true } } },
  });

  const data = latestPerSender.map((n) => ({
    senderId: n.sender_id,
    senderName: n.sender?.username ?? "Unknown",
    senderLogo: n.sender?.logoUrl ?? null,
    message: n.message,
    is_read: n.is_read,
    created_at: n.created_at,
  }));

  return NextResponse.json(data);
}
