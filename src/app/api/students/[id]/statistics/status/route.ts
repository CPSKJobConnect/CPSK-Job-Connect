import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Canonicalize input
    const accountId = parseInt(id?.trim() ?? "", 10);
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

    // Fetch all status names in a single query to avoid N+1 problem
    const [statusData, allStatuses] = await Promise.all([
      prisma.application.groupBy({
        by: ["status"],
        where: { student_id: student.id },
        _count: { id: true },
      }),
      prisma.applicationStatus.findMany({
        select: { id: true, name: true },
      }),
    ]);

    // Create a map for O(1) status name lookup
    const statusMap = new Map(allStatuses.map(s => [s.id, s.name]));

    // Map results without additional database queries
    const result = statusData.map((item) => ({
      name: statusMap.get(item.status) || "Unknown",
      value: item._count.id,
    }));

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching status data:", error);
    }
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
