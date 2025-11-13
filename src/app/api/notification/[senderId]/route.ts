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
  const senderIdNum = Number(senderId);

  const messages = await prisma.notification.findMany({
    where: { account_id: accountId, sender_id: senderIdNum },
    orderBy: { created_at: "desc" },
  });

  prisma.notification.updateMany({
    where: { account_id: accountId, sender_id: senderIdNum, is_read: false },
    data: { is_read: true },
  });

  return NextResponse.json(messages);
}
