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

    const categoryData = await prisma.application.groupBy({
      by: ["job_post_id"],
      where: { student_id: student.id },
      _count: { id: true },
    });

    const resultMap: Record<string, number> = {};

    for (const app of categoryData) {
      const job = await prisma.jobPost.findUnique({
        where: { id: app.job_post_id },
        select: { category: { select: { name: true } } },
      });
      const categoryName = job?.category?.name || "Unknown";

      if (resultMap[categoryName]) {
        resultMap[categoryName] += app._count.id;
      } else {
        resultMap[categoryName] = app._count.id;
      }
    }

    const result = Object.entries(resultMap).map(([name, value]) => ({ name, value }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching category data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
