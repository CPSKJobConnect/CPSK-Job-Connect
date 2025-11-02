import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const accountId = Number(params.id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { account_id: accountId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const statusData = await prisma.application.groupBy({
      by: ["status"],
      where: { student_id: student.id },
      _count: { id: true },
    });

    const result = await Promise.all(
      statusData.map(async (item) => {
        const status = await prisma.applicationStatus.findUnique({
          where: { id: item.status },
        });
        return {
          name: status?.name || "Unknown",
          value: item._count.id,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching status data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
