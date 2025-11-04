import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getApiSession(req as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const appId = Number(id);
    if (isNaN(appId))
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });

    const { status_id } = await req.json();
    if (!status_id)
      return NextResponse.json({ error: "status_id is required" }, { status: 400 });

    const updated = await prisma.application.update({
      where: { id: appId },
      data: { status: status_id },
      include: {
        applicationStatus: true,
        jobPost: { select: { jobName: true } },
        student: {
          include: { account: true }
        }
      },
    });

    const message = `Your application for "${updated.jobPost.jobName}" has been updated to "${updated.applicationStatus.name}".`;

    await prisma.notification.create({
      data: {
        account_id: updated.student.account_id,
        message,
        sender_id: Number(session.user.id),
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
