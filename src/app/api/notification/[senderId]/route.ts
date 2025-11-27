import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ senderId: string }> }
) {
  const { senderId } = await params;
  const session = await getApiSession(req);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = Number(session.user.id);

  // Canonicalize senderId (ASVS 1.1.1)
  let senderIdNum: number | null = null;
  if (senderId !== "system" && senderId !== "null") {
    const decodedSenderId = decodeURIComponent(senderId);
    const parsedSenderId = Number(decodedSenderId);
    if (!isNaN(parsedSenderId)) {
      senderIdNum = parsedSenderId;
    } else {
      return NextResponse.json({ error: "Invalid sender ID" }, { status: 400 });
    }
  }

  const messages = await prisma.notification.findMany({
    where: { account_id: accountId, sender_id: senderIdNum },
    orderBy: { created_at: "desc" },
  });

  // Mark all messages from this sender as read
  await prisma.notification.updateMany({
    where: { account_id: accountId, sender_id: senderIdNum, is_read: false },
    data: { is_read: true },
  });

  return NextResponse.json(messages);
}
