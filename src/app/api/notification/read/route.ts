import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await getApiSession(request);

  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();

  try {
    await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return Response.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
