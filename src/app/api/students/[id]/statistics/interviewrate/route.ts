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

    // ดึง applications พร้อม jobPost.category และ status
    const applications = await prisma.application.findMany({
      where: { student_id: student.id },
      include: {
        jobPost: { include: { category: true } },
        applicationStatus: true,
      },
    });

    const categoryMap: Record<string, { interview: number; total: number }> = {};

    for (const app of applications) {
      const categoryName = app.jobPost.category?.name || "Unknown";
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { interview: 0, total: 0 };
      }
      categoryMap[categoryName].total += 1;
      if (app.applicationStatus.name === "Interview") {
        categoryMap[categoryName].interview += 1;
      }
    }

    const result = Object.entries(categoryMap).map(([category, { interview, total }]) => ({
      category,
      conversionRate: total > 0 ? Math.round((interview / total) * 100) : 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching interview conversion rate:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
