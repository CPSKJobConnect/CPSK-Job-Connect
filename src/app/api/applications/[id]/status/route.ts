import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const appId = Number(id);
    if (isNaN(appId)) return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });

    const { status_id } = await req.json();
    if (!status_id) return NextResponse.json({ error: "status_id is required" }, { status: 400 });

    const updated = await prisma.application.update({
      where: { id: appId },
      data: { status: status_id },
      include: { applicationStatus: true },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}