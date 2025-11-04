import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);

  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { account_id: Number(session?.user?.id) },
    orderBy: { created_at: "desc" },
  });

  return Response.json(notifications);
}
