import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { is_resolved } = body;

    if (typeof is_resolved !== "boolean") {
      return NextResponse.json(
        { error: "Invalid value for is_resolved" },
        { status: 400 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { is_resolved },
    });

    return NextResponse.json(updatedReport, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
